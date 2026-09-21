import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');

function stepCode(workflow: string, name: string, field: string): string {
  const source = fs.readFileSync(path.join(root, '.github/workflows', workflow), 'utf8');
  const step = source.split(`      - name: ${name}\n`)[1]?.split('\n      - name: ')[0];
  assert.ok(step, `Missing step: ${name}`);
  const match = step.match(new RegExp(`^( +)${field}: \\|\\n`, 'm'));
  assert.ok(match, `Missing ${field} block: ${name}`);
  const indent = match[1]!.length + 2;
  const lines = step.slice(match.index! + match[0].length).split('\n');
  const end = lines.findIndex((line) => line.trim() && !line.startsWith(' '.repeat(indent)));
  return lines.slice(0, end < 0 ? undefined : end).map((line) => line.slice(indent)).join('\n');
}

const passed = { status: 'passed', summary: { errors: 0, autoFixable: 0 }, findings: [] };

async function comment(report: unknown, conclusion = 'failure', components?: unknown): Promise<string> {
  let body = '';
  const script = stepCode('report-docs-validation.yml', 'Update validation comment', 'script');
  const execute = vm.runInNewContext(`(async () => { ${script}\n })`, {
    require: () => ({
      readFileSync(file: string) {
        const data = file.startsWith('validation-artifact/') ? report : components;
        if (data === undefined) throw new Error('No report');
        return JSON.stringify(data);
      },
    }),
    process: { env: { PULL_REQUEST_NUMBER: '1280', VALIDATION_RUN_URL: 'https://example.com/run', VALIDATION_CONCLUSION: conclusion } },
    context: { repo: { owner: 'lightdash', repo: 'mintlify-docs' } },
    github: {
      paginate: async () => [],
      rest: { issues: {
        listComments: {},
        createComment: async (args: { body: string }) => { body = args.body; },
      } },
    },
  }) as () => Promise<void>;
  await execute();
  return body;
}

test('describes missing reports without claiming a validator crash or linking an absent artifact', async () => {
  const body = await comment(undefined);
  assert.match(body, /report is unavailable/i);
  assert.doesNotMatch(body, /tooling error|Download the structured/);
  assert.match(body, /View the validation run/);
});

test('reports IA findings as actionable content errors', async () => {
  const body = await comment({
    status: 'failed', summary: { errors: 1, autoFixable: 0 },
    findings: [{ file: 'docs.json', line: 12, rule: 'ia.missing-annotation', message: 'Add charts to the IA map.' }],
  });
  assert.match(body, /1 blocking finding/);
  assert.match(body, /docs.json:12/);
  assert.match(body, /ia.missing-annotation/);
  assert.doesNotMatch(body, /tooling error/);
});

test('does not claim all checks passed when another check failed', async () => {
  const body = await comment(passed, 'failure', {
    status: 'advisory', summary: { warnings: 1, byRule: { 'callout.adjacent': 1 } },
  });
  assert.match(body, /another workflow check failed/i);
  assert.doesNotMatch(body, /All blocking checks passed/);
});

test('distinguishes a component tool failure from a clean audit', async () => {
  const body = await comment(passed, 'failure', {
    status: 'tool_failure', summary: { warnings: 0, byRule: {} },
  });
  assert.match(body, /component audit failed/i);
  assert.doesNotMatch(body, /0 finding\(s\) across/);
});

test('reports a successful run and an actual validator failure distinctly', async () => {
  assert.match(await comment(passed, 'success'), /All blocking checks passed/);
  assert.match(await comment({ ...passed, status: 'tool_failure' }), /validator failed/i);
});

test('writes a useful job summary when validation never produced a report', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-workflow-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const summary = path.join(directory, 'summary.md');
  const result = spawnSync('bash', ['-e', '-c', stepCode('validate-docs.yml', 'Write job summary', 'run')], {
    cwd: directory,
    encoding: 'utf8',
    env: { ...process.env, REPORT_DIR: path.join(directory, 'reports'), GITHUB_STEP_SUMMARY: summary },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(fs.readFileSync(summary, 'utf8'), /report is unavailable/i);
});

test('writes fresh reports outside the checkout even when tracked reports exist', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-workflow-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, '.mintlify'));
  fs.writeFileSync(path.join(directory, '.mintlify/ia-map.yml'), 'Retired:\n  for: Retired section.\n');
  fs.writeFileSync(path.join(directory, 'docs.json'), JSON.stringify({ navigation: { pages: [] } }));
  fs.writeFileSync(path.join(directory, 'component-audit.json'), 'stale');
  fs.writeFileSync(path.join(directory, 'docs-validation.json'), JSON.stringify(passed));
  fs.cpSync(path.join(root, 'scripts'), path.join(directory, 'scripts'), { recursive: true });
  const reports = path.join(directory, 'reports');
  const output = path.join(directory, 'outputs');
  const result = spawnSync('bash', ['-e', '-c', stepCode('validate-docs.yml', 'Run documentation validator', 'run')], {
    cwd: directory, encoding: 'utf8',
    env: { ...process.env, REPORT_DIR: reports, GITHUB_OUTPUT: output, EVENT_NAME: 'workflow_dispatch' },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(fs.readFileSync(output, 'utf8'), /exit_code=1/);
  const report = JSON.parse(fs.readFileSync(path.join(reports, 'docs-validation.json'), 'utf8'));
  assert.equal(report.status, 'failed');
  assert.equal(report.findings[0]?.rule, 'ia.orphaned-annotation');
  assert.equal(fs.readFileSync(path.join(directory, 'component-audit.json'), 'utf8'), 'stale');

  const audit = spawnSync('bash', ['-e', '-c', stepCode('validate-docs.yml', 'Check the component baseline', 'run')], {
    cwd: directory, encoding: 'utf8',
    env: { ...process.env, REPORT_DIR: reports, GITHUB_OUTPUT: output, EVENT_NAME: 'workflow_dispatch' },
  });
  assert.equal(audit.status, 0, audit.stderr);
  const components = JSON.parse(fs.readFileSync(path.join(reports, 'component-audit.json'), 'utf8'));
  assert.equal(components.status, 'passed');
  assert.equal(components.summary.warnings, 0);
  assert.equal(fs.readFileSync(path.join(directory, 'component-audit.json'), 'utf8'), 'stale');
});

test('reports a tool failure when the validator exits without producing a report', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-workflow-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, 'scripts/docs'), { recursive: true });
  fs.writeFileSync(path.join(directory, 'scripts/docs/validate.ts'), 'process.exit(1);');
  fs.writeFileSync(path.join(directory, 'docs-validation.json'), JSON.stringify(passed));
  const reports = path.join(directory, 'reports');
  const output = path.join(directory, 'outputs');
  const result = spawnSync('bash', ['-e', '-c', stepCode('validate-docs.yml', 'Run documentation validator', 'run')], {
    cwd: directory, encoding: 'utf8',
    env: { ...process.env, REPORT_DIR: reports, GITHUB_OUTPUT: output, EVENT_NAME: 'workflow_dispatch' },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(fs.readFileSync(output, 'utf8'), /exit_code=2/);
  const report = JSON.parse(fs.readFileSync(path.join(reports, 'docs-validation.json'), 'utf8'));
  assert.equal(report.status, 'tool_failure');
});
