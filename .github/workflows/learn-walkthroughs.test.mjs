import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
    chmodSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    renameSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

const workflow = readFileSync(
    new URL('./learn-walkthroughs.yml', import.meta.url),
    'utf8',
);
const step = workflow
    .split('      - name: Does this pull request touch a cited page?')[1]
    .split('\n      - name:')[0];
const script = step.split('        run: |\n')[1].replace(/^ {10}/gm, '');

for (const kind of ['rename', 'navigation', 'unrelated']) {
    test(`docs change selection handles ${kind}`, () => {
        const cwd = mkdtempSync(path.join(tmpdir(), 'docs-walkthrough-ci-'));
        try {
            const docs = path.join(cwd, 'docs');
            const frontend = path.join(cwd, 'lightdash/packages/frontend/src');
            mkdirSync(docs);
            mkdirSync(frontend, { recursive: true });
            writeFileSync(
                path.join(frontend, 'Marker.tsx'),
                'data-tour-docs="spaces.mdx#intro:1"',
            );
            writeFileSync(
                path.join(docs, 'spaces.mdx'),
                'A cited docs page.\n',
            );
            writeFileSync(
                path.join(docs, 'docs.json'),
                '{"navigation":["spaces"]}',
            );
            const git = (...args) =>
                execFileSync('git', args, {
                    cwd: docs,
                    encoding: 'utf8',
                }).trim();
            git('init', '-q');
            git('add', '.');
            git(
                '-c',
                'user.name=Test',
                '-c',
                'user.email=test@example.com',
                'commit',
                '-qm',
                'base',
            );
            const base = git('rev-parse', 'HEAD');
            if (kind === 'rename')
                renameSync(
                    path.join(docs, 'spaces.mdx'),
                    path.join(docs, 'moved.mdx'),
                );
            if (kind === 'navigation')
                writeFileSync(
                    path.join(docs, 'docs.json'),
                    '{"navigation":[]}',
                );
            if (kind === 'unrelated')
                writeFileSync(path.join(docs, 'other.mdx'), 'Unrelated docs.');
            git('add', '.');
            git(
                '-c',
                'user.name=Test',
                '-c',
                'user.email=test@example.com',
                'commit',
                '-qm',
                'change',
            );
            const output = path.join(cwd, 'outputs');
            const result = spawnSync(
                'bash',
                ['--noprofile', '--norc', '-e', '-o', 'pipefail', '-c', script],
                {
                    cwd,
                    encoding: 'utf8',
                    env: {
                        ...process.env,
                        EVENT_NAME: 'pull_request',
                        BASE_SHA: base,
                        HEAD_SHA: 'HEAD',
                        GITHUB_OUTPUT: output,
                    },
                },
            );
            assert.equal(result.status, 0, result.stderr);
            assert.equal(
                readFileSync(output, 'utf8'),
                `run=${kind !== 'unrelated'}\n`,
            );
        } finally {
            rmSync(cwd, { recursive: true, force: true });
        }
    });
}

for (const kind of ['citation', 'navigation', 'unchanged']) {
    test(
        kind === 'unchanged'
            ? 'existing generation errors alone do not block docs'
            : `existing generation error cannot hide a new ${kind} error`,
        () => {
            const cwd = mkdtempSync(path.join(tmpdir(), 'docs-validation-'));
            try {
                const docs = path.join(cwd, 'docs');
                const product = path.join(cwd, 'lightdash');
                const bin = path.join(cwd, 'bin');
                mkdirSync(docs);
                mkdirSync(bin);
                mkdirSync(path.join(product, 'scripts/scope-tours'), {
                    recursive: true,
                });
                mkdirSync(
                    path.join(product, 'packages/frontend/src/features/learn'),
                    { recursive: true },
                );
                mkdirSync(
                    path.join(
                        product,
                        'packages/frontend/src/features/scopeTours',
                    ),
                    {
                        recursive: true,
                    },
                );
                for (const artifact of ['generated.ts', 'curriculum.ts'])
                    writeFileSync(
                        path.join(
                            product,
                            'packages/frontend/src/features/scopeTours',
                            artifact,
                        ),
                        'committed',
                    );
                writeFileSync(
                    path.join(product, 'scripts/scope-tours/lib.ts'),
                    `
exports.frontendSrc = 'frontend';
exports.LESSON_SOURCE = 'lessons';
exports.listTsx = () => ['marker'];
exports.findMarkers = () => [{file:'marker', docs:'old.mdx#missing:1', resultDocs:'new.mdx#intro:1'}];
exports.docsParagraph = (ref) => {
  if (ref.startsWith('old') || require('fs').readFileSync(process.env.LIGHTDASH_DOCS_DIR+'/new.mdx','utf8') === 'broken') throw new Error('Docs anchor not found: '+ref);
};
`,
                );
                writeFileSync(
                    path.join(
                        product,
                        'packages/frontend/src/features/learn/sandboxLessons.ts',
                    ),
                    'exports.SANDBOX_LESSONS = [];',
                );
                const git = (dir, ...args) =>
                    execFileSync('git', args, {
                        cwd: dir,
                        encoding: 'utf8',
                    }).trim();
                const commit = (dir) => {
                    git(dir, 'add', '.');
                    git(
                        dir,
                        '-c',
                        'user.name=Test',
                        '-c',
                        'user.email=test@example.com',
                        'commit',
                        '-qm',
                        'fixture',
                    );
                };
                git(product, 'init', '-q');
                commit(product);
                git(docs, 'init', '-q');
                writeFileSync(path.join(docs, 'new.mdx'), 'valid');
                writeFileSync(path.join(docs, 'docs.json'), 'valid');
                commit(docs);
                const base = git(docs, 'rev-parse', 'HEAD');
                writeFileSync(
                    path.join(
                        docs,
                        kind === 'citation'
                            ? 'new.mdx'
                            : kind === 'navigation'
                              ? 'docs.json'
                              : 'unrelated.mdx',
                    ),
                    'broken',
                );
                commit(docs);
                writeFileSync(
                    path.join(bin, 'pnpm'),
                    `#!/bin/bash
set -eu
# Corepack resolves the pinned version before pnpm processes any -C argument.
if [ "$PWD" != "$GITHUB_WORKSPACE/lightdash" ]; then
  echo 'Corepack must start inside the Lightdash checkout' >&2
  exit 42
fi
if [ "$1" = exec ]; then
  if [ "$3" = scripts/scope-tours/check.ts ]; then echo '[{"level":"error","file":"checker","message":"old broken citation"}]'; exit 1; fi
  node "$3"
elif [ "$1" = scope-tours:generate ]; then
  echo 'Error: old broken citation'; exit 1
elif [ "$1" = scope-tours:order ]; then
  if [ "$(cat "$LIGHTDASH_DOCS_DIR/docs.json")" = broken ]; then echo 'Error: Not in the docs sidebar (docs.json): new'; exit 1; fi
fi
`,
                );
                chmodSync(path.join(bin, 'pnpm'), 0o755);
                const checkStep = workflow.split(
                    '      - name: Check walkthroughs against the base and this pull request',
                )[1];
                const checkScript = checkStep
                    .split('        run: |\n')[1]
                    .replace(/^ {10}/gm, '');
                const result = spawnSync(
                    'bash',
                    ['-e', '-o', 'pipefail', '-c', checkScript],
                    {
                        cwd,
                        encoding: 'utf8',
                        env: {
                            ...process.env,
                            PATH: `${bin}:${process.env.PATH}`,
                            EVENT_NAME: 'pull_request',
                            BASE_SHA: base,
                            GITHUB_WORKSPACE: cwd,
                            RUNNER_TEMP: cwd,
                            GITHUB_STEP_SUMMARY: path.join(cwd, 'summary'),
                        },
                    },
                );
                assert.equal(
                    result.status,
                    kind === 'unchanged' ? 0 : 1,
                    result.stdout + result.stderr,
                );
                assert.match(
                    readFileSync(path.join(cwd, 'summary'), 'utf8'),
                    kind === 'citation'
                        ? /new.mdx#intro/
                        : kind === 'navigation'
                          ? /Not in the docs sidebar/
                          : /No walkthrough validation error introduced/,
                );
            } finally {
                rmSync(cwd, { recursive: true, force: true });
            }
        },
    );
}

for (const [kind, pages, status] of [
    ['partial fix', ['explore/homepage'], 0],
    ['reordering', ['explore/homepage', 'explore/spaces'], 0],
    ['new missing page', ['explore/homepage', 'explore/new'], 1],
]) {
    test(`navigation comparison handles ${kind}`, () => {
        const cwd = mkdtempSync(path.join(tmpdir(), 'docs-navigation-'));
        try {
            const finding = (pages) => [
                {
                    level: 'error',
                    file: 'scope-tours:order',
                    message: `Error: Not in the docs sidebar (docs.json): ${pages.join(', ')}`,
                },
            ];
            writeFileSync(
                path.join(cwd, 'base.json'),
                JSON.stringify(finding(['explore/spaces', 'explore/homepage'])),
            );
            writeFileSync(
                path.join(cwd, 'head.json'),
                JSON.stringify(finding(pages)),
            );
            const comparison = workflow
                .split("          node - <<'NODE'\n")[1]
                .split('\n          NODE')[0]
                .replace(/^ {10}/gm, '');
            const summary = path.join(cwd, 'summary');
            const result = spawnSync('node', ['-e', comparison], {
                cwd,
                encoding: 'utf8',
                env: { ...process.env, GITHUB_STEP_SUMMARY: summary },
            });
            assert.equal(result.status, status, result.stdout + result.stderr);
            if (status === 0)
                assert.match(
                    readFileSync(summary, 'utf8'),
                    /No walkthrough validation error introduced/,
                );
            else {
                assert.match(result.stdout, /explore\/new/);
                assert.doesNotMatch(result.stdout, /explore\/homepage/);
            }
        } finally {
            rmSync(cwd, { recursive: true, force: true });
        }
    });
}
