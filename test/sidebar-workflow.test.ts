import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');

test('index generation detects changed sidebar labels and regenerates a passing snapshot', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sidebar-index-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'docs.json'), JSON.stringify({ navigation: { tabs: [{ tab: 'Docs', pages: ['intro'] }] } }));
  const page = path.join(directory, 'intro.mdx');
  fs.writeFileSync(page, '---\ntitle: Introduction\n---\n');
  const generate = (...args: string[]) => spawnSync(process.execPath, [path.join(root, 'scripts/docs/build-sidebar-navigation.ts'), ...args], { cwd: directory, encoding: 'utf8' });
  assert.equal(generate().status, 0);
  fs.writeFileSync(page, '---\ntitle: Introduction\nsidebarTitle: Start here\n---\n');
  const stale = generate('--check');
  assert.notEqual(stale.status, 0);
  assert.match(stale.stderr, /Run aube run build:sidebar-navigation/);
  assert.equal(generate().status, 0);
  assert.match(fs.readFileSync(path.join(directory, 'sidebar-navigation.js'), 'utf8'), /Start here/);
  assert.equal(generate('--check').status, 0);
});

test('checking a missing index tells the author how to generate it', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sidebar-index-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'docs.json'), JSON.stringify({ navigation: { tabs: [] } }));
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/docs/build-sidebar-navigation.ts'), '--check'], { cwd: directory, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Run aube run build:sidebar-navigation/);
});

function updateScript(): string {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/sidebar-navigation.yml'), 'utf8');
  return workflow.split('          script: |\n')[1]!.split('\n').map((line) => line.slice(12)).join('\n');
}

async function refresh({ moved = false, fork = false, race = false, existingComment = false, commentFailure = false } = {}) {
  const files = new Map([['intro.mdx', 'PR content'], ['sidebar-navigation.js', 'stale index']]);
  const initial = new Map(files);
  let nextFiles = new Map(files);
  let parent: string | undefined;
  const failures: string[] = [];
  let updated = false;
  const comments = [
    { id: 1, user: { login: 'contributor' }, body: '<!-- sidebar-navigation-index --> Human comment' },
    ...(existingComment ? [{ id: 2, user: { login: 'github-actions[bot]' }, body: '<!-- sidebar-navigation-index --> Earlier refresh' }] : []),
  ];
  const warnings: string[] = [];
  const pull = { number: 123, state: 'open', base: { ref: 'main' }, head: { sha: moved ? 'newer' : 'head', ref: 'sidebar-work', repo: { full_name: fork ? 'contributor/docs' : 'lightdash/mintlify-docs' } } };
  const context = { serverUrl: 'https://github.com', runId: 456, repo: { owner: 'lightdash', repo: 'mintlify-docs' }, payload: { pull_request: { number: 123, head: { sha: 'head' } } } };
  const execute = vm.runInNewContext(`(async () => { ${updateScript()}\n })`, {
    Buffer,
    require: () => ({
      lstatSync: () => ({ isFile: () => true, size: 20 }),
      readFileSync: () => Buffer.from('generated index'),
    }),
    context,
    core: { setFailed: (message: string) => failures.push(message), warning: (message: string) => warnings.push(message), info: () => {}, summary: { addRaw() { return this; }, async write() {} } },
    github: { paginate: async () => comments, rest: {
      pulls: { get: async () => ({ data: pull }) },
      issues: {
        listComments: async () => ({}),
        createComment: async ({ body }: { body: string }) => {
          if (commentFailure) throw new Error('Comment permission denied');
          comments.push({ id: 2, user: { login: 'github-actions[bot]' }, body });
        },
        updateComment: async ({ comment_id, body }: { comment_id: number; body: string }) => {
          const comment = comments.find(({ id }) => id === comment_id)!;
          comment.body = body;
        },
      },
      git: {
        getCommit: async () => ({ data: { tree: { sha: 'base-tree' } } }),
        createBlob: async () => ({ data: { sha: 'index-blob' } }),
        createTree: async ({ tree }: { tree: { path: string; sha: string }[] }) => {
          nextFiles = new Map(files);
          for (const entry of tree) {
            assert.equal(entry.sha, 'index-blob');
            nextFiles.set(entry.path, 'generated index');
          }
          return { data: { sha: 'next-tree' } };
        },
        createCommit: async ({ parents }: { parents: string[] }) => { parent = parents[0]; return { data: { sha: 'index-commit' } }; },
        updateRef: async ({ ref, force }: { ref: string; force: boolean }) => {
          assert.equal(ref, 'heads/sidebar-work');
          assert.equal(force, false);
          if (race) throw new Error('Update is not a fast forward');
          updated = true;
          files.clear();
          for (const [key, value] of nextFiles) files.set(key, value);
        },
      },
    } },
  }) as () => Promise<void>;
  let error: unknown;
  try { await execute(); } catch (caught) { error = caught; }
  return { files, initial, failures, updated, parent, error, comments, warnings };
}

test('automatic refresh changes only the index on top of the checked PR head', async () => {
  const result = await refresh();
  assert.equal(result.error, undefined);
  assert.deepEqual(result.failures, []);
  assert.equal(result.updated, true);
  assert.equal(result.parent, 'head');
  assert.deepEqual(result.files, new Map([['intro.mdx', 'PR content'], ['sidebar-navigation.js', 'generated index']]));
});

test('automatic refresh refuses an outdated PR head and a fork branch', async () => {
  for (const options of [{ moved: true }, { fork: true }]) {
    const result = await refresh(options);
    assert.equal(result.updated, false);
    assert.deepEqual(result.files, result.initial);
    assert.equal(result.failures.length, 1);
  }
});

test('a concurrent push cannot be overwritten by automatic refresh', async () => {
  const result = await refresh({ race: true });
  assert.equal(result.updated, false);
  assert.deepEqual(result.files, result.initial);
  assert.match(String(result.error), /not a fast forward/);
  assert.equal(result.comments.length, 1);
});

test('a successful refresh explains its commit and the CI approval action in a PR comment', async () => {
  const result = await refresh();
  const comment = result.comments.find(({ user }) => user.login === 'github-actions[bot]');
  assert.ok(comment);
  assert.match(comment.body, /commit\/index-commit/);
  assert.match(comment.body, /Approve workflows to run/);
  assert.match(comment.body, /write access/);
  assert.match(comment.body, /actions\/runs\/456/);
});

test('refresh updates its bot comment without replacing a human comment or adding duplicates', async () => {
  const result = await refresh({ existingComment: true });
  assert.equal(result.comments.length, 2);
  assert.match(result.comments[0]!.body, /Human comment/);
  assert.match(result.comments[1]!.body, /commit\/index-commit/);
});

test('a failed explanation comment does not undo or misreport a successful refresh', async () => {
  const result = await refresh({ commentFailure: true });
  assert.equal(result.updated, true);
  assert.equal(result.error, undefined);
  assert.deepEqual(result.failures, []);
  assert.match(result.warnings.join(' '), /comment/i);
});
