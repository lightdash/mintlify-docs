import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const workflow = (name: string) => fs.readFileSync(
  new URL(`../.github/workflows/${name}.yml`, import.meta.url), 'utf8',
);

test('docs selection excludes inherited stack changes and base-only commits', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-pr-base-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const commit = (file: string) => {
    fs.writeFileSync(path.join(root, file), file);
    git('add', '.');
    git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', file);
  };
  git('init', '-q');
  commit('main.mdx');
  commit('inherited.mdx');
  const stackBase = git('rev-parse', 'HEAD');
  commit('layer.mdx');
  const head = git('rev-parse', 'HEAD');
  git('checkout', '-q', stackBase);
  commit('base-only.mdx');
  const base = git('rev-parse', 'HEAD');
  git('checkout', '-q', head);

  const script = workflow('validate-docs').split('      - name: List changed files')[1]
    .split('\n      - name:')[0].split('        run: ')[1].trim();
  const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
    cwd: root, encoding: 'utf8', env: { ...process.env, BASE_SHA: base, HEAD_SHA: head },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(root, 'changed-files.txt'), 'utf8'), 'layer.mdx\n');
});

