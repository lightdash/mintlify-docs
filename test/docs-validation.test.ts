import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { auditExternalLinks } from '../scripts/docs/audit-external-links.ts';
import { buildWorkflowAnnotations } from '../scripts/docs/lib/findings.ts';
import { validateDocs } from '../scripts/docs/validate.ts';

function fixture(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-validation-'));
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return root;
}

function page(body = ''): string {
  return `---\ntitle: Page\ndescription: A complete page.\n---\n\n${body}\n`;
}

test('reports each IA invariant with structured locations', async (t) => {
  const root = fixture({
    'docs.json': JSON.stringify({
      navigation: { pages: ['index', 'missing'] },
      redirects: [
        { source: '/first', destination: '/second' },
        { source: '/second', destination: '/missing-target' },
      ],
    }),
    'index.mdx': page('[Broken](/absent)\n\n[Redirected](/first)'),
    'orphan.mdx': '---\ntitle: Orphan\n---\n',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const report = await validateDocs({ root });
  const rules = new Set(report.findings.map(({ rule }) => rule));

  assert.equal(report.schemaVersion, 1);
  assert.equal(report.status, 'failed');
  assert.deepEqual(rules, new Set([
    'frontmatter.description',
    'link.broken-internal',
    'link.redirected-internal',
    'navigation.missing-page',
    'navigation.orphaned-page',
    'redirect.chain',
    'redirect.missing-destination',
  ]));
  assert.ok(report.findings.every(({ file, line }) => file && Number.isInteger(line)));
});

test('limits PR findings to files controlled by the change', async (t) => {
  const root = fixture({
    'docs.json': JSON.stringify({ navigation: { pages: ['changed', 'existing'] } }),
    'changed.mdx': page('[Broken](/missing-changed)'),
    'existing.mdx': page('[Broken](/missing-existing)'),
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const report = await validateDocs({ root, changedFiles: ['changed.mdx'] });

  assert.equal(report.scope, 'changed');
  assert.equal(report.findings.length, 1);
  assert.equal(report.findings[0]?.file, 'changed.mdx');
});

test('marks misplaced images as auto-fixable without changing files', async (t) => {
  const root = fixture({
    'docs.json': JSON.stringify({ navigation: { pages: ['guide/page'] } }),
    'guide/page.mdx': page('![Chart](/images/other/chart.png)'),
    'images/other/chart.png': 'image',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const report = await validateDocs({ root });
  const finding = report.findings.find(({ rule }) => rule === 'image.wrong-location');

  assert.equal(finding?.autoFixable, true);
  assert.equal(report.summary.autoFixable, 1);
  assert.equal(fs.existsSync(path.join(root, 'images/other/chart.png')), true);
});

test('reports external failures as advisory structured findings', async (t) => {
  const root = fixture({
    'docs.json': JSON.stringify({ navigation: { pages: ['index'] } }),
    'index.mdx': page('[Unavailable](https://example.com/down)'),
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const report = await auditExternalLinks({
    root,
    checkUrl: async () => ({ ok: false, status: 503 }),
  });

  assert.equal(report.status, 'advisory');
  assert.equal(report.findings[0]?.rule, 'external.unreachable');
  assert.equal(report.findings[0]?.severity, 'warning');
  assert.equal(report.findings[0]?.file, 'index.mdx');
  assert.equal(report.findings[0]?.line, 6);
});

test('uses a separate exit condition and report for tool failures', (t) => {
  const root = fixture({ 'docs.json': '{ invalid' });
  const output = path.join(root, 'report.json');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const result = spawnSync(process.execPath, [
    path.join(import.meta.dirname, '../scripts/docs/validate.ts'),
    '--output',
    output,
  ], { cwd: root });
  const report = JSON.parse(fs.readFileSync(output, 'utf8')) as { status: string; findings: unknown[] };

  assert.equal(result.status, 2);
  assert.equal(report.status, 'tool_failure');
  assert.deepEqual(report.findings, []);
});

test('leaves OpenAPI-generated routes to Mintlify validation', async (t) => {
  const root = fixture({
    'docs.json': JSON.stringify({
      navigation: {
        tabs: [
          { pages: ['index'] },
          { groups: [{ openapi: 'https://example.com/openapi.json' }] },
        ],
      },
    }),
    'index.mdx': page('[Generated endpoint](/api-reference/scim/list-users)'),
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const report = await validateDocs({ root });

  assert.equal(report.status, 'passed');
});

test('builds escaped annotations within GitHub step limits', () => {
  const findings = Array.from({ length: 12 }, (_, index) => ({
    severity: 'error' as const,
    file: `guide,file:${index}.mdx`,
    line: index + 1,
    rule: 'link:broken-internal',
    message: 'Broken 100%\nnext line',
    autoFixable: false,
  }));

  const annotations = buildWorkflowAnnotations(findings);

  assert.equal(annotations.commands.length, 10);
  assert.equal(annotations.omitted, 2);
  assert.equal(
    annotations.commands[0],
    '::error file=guide%2Cfile%3A0.mdx,line=1,title=link%3Abroken-internal::Broken 100%25%0Anext line',
  );
});
