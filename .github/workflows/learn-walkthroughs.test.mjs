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
import { compareFindings, normalizeFindings } from './learn-findings.mjs';

test('equal and introduced tool crashes block comparison without claiming repairs', () => {
    const content = normalizeFindings([
        {
            level: 'error',
            file: 'packages/Marker.tsx',
            ref: 'spaces.mdx#intro:1',
            message: 'Docs anchor not found: spaces.mdx#intro:1',
        },
    ]);
    const crash = normalizeFindings([
        {
            level: 'error',
            category: 'tool',
            file: 'checker',
            message: 'TypeError: parser crashed',
        },
    ]);
    for (const base of [crash, content]) {
        const result = compareFindings(base, crash);
        assert.equal(result.blocked, true);
        assert.deepEqual(result.repaired, []);
    }
});

test('citation roots deduplicate checker and generator errors with stable identities', () => {
    const rows = [
        {
            level: 'error',
            file: '/tmp/run/lightdash/packages/Marker.tsx',
            line: 12,
            ref: 'spaces.mdx#missing:1',
            selector: '[data-tour-step="1"]',
            message: 'Docs anchor not found: spaces.mdx#missing:1',
        },
        {
            level: 'error',
            file: 'scripts/scope-tours',
            message: 'Docs anchor not found: spaces.mdx#missing:2',
        },
        {
            level: 'error',
            file: 'scope-tours:generate',
            message: 'Error: Docs anchor not found: spaces.mdx#missing:1',
        },
    ];
    const findings = normalizeFindings(rows, ['/tmp/run/lightdash']);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].owners[0].file, 'packages/Marker.tsx');
    assert.equal(findings[0].citations.length, 2);
    assert.deepEqual(findings[0].citations[0].selectors, ['1']);
    assert.equal(
        findings[0].id,
        normalizeFindings(
            [{ ...rows[0], file: '/other/lightdash/packages/Marker.tsx' }],
            ['/other/lightdash'],
        )[0].id,
    );
    assert.equal(
        compareFindings(findings, normalizeFindings(rows.slice(1))).blocked,
        false,
    );
});

test('partial citation repairs report only removed roots', () => {
    const rows = ['first', 'second'].map((anchor) => ({
        level: 'error',
        file: 'packages/Marker.tsx',
        message: `Docs anchor not found: spaces.mdx#${anchor}:1`,
    }));
    const result = compareFindings(
        normalizeFindings(rows),
        normalizeFindings(rows.slice(1)),
    );
    assert.equal(result.blocked, false);
    assert.equal(result.repaired.length, 1);
    assert.equal(result.repaired[0].target, 'spaces.mdx#first');
});

test('caught product builder crashes are tool failures even in valid checker JSON', () => {
    const crash = normalizeFindings([
        {
            level: 'error',
            file: 'scripts/scope-tours',
            message: "Cannot read properties of undefined (reading 'split')",
        },
    ]);
    assert.equal(crash[0].category, 'tool');
    assert.equal(compareFindings(crash, crash).blocked, true);
});

for (const [cause, ref, message] of [
    [
        'missing-anchor',
        'spaces.mdx#missing:1',
        'Docs anchor not found: spaces.mdx#missing:1',
    ],
    [
        'missing-page',
        'spaces.mdx#intro:1',
        "ENOENT: no such file or directory, open '/tmp/docs/spaces.mdx'",
    ],
    ['missing-title', 'spaces.mdx', 'Docs page has no title: spaces.mdx'],
    [
        'offsite-link',
        'spaces.mdx#intro:1',
        'Docs link off the docs site is not allowed in a walkthrough: https://example.com (in spaces.mdx)',
    ],
    [
        'missing-paragraph',
        'spaces.mdx#intro:p2:1',
        'spaces.mdx#intro:p2:1: paragraph 2 not found (1 prose paragraphs)',
    ],
    [
        'missing-list-item',
        'spaces.mdx#intro:li2:1',
        'spaces.mdx#intro:li2:1: list item 2 not found (1 items)',
    ],
    [
        'missing-sentence',
        'spaces.mdx#intro:4',
        'spaces.mdx#intro:4: sentence range out of bounds (1 sentences)',
    ],
    [
        'missing-sentence',
        'spaces.mdx#intro:1',
        'No sentences found under spaces.mdx#intro:1',
    ],
]) {
    test(`${cause} parser diagnostics deduplicate across collector and generator`, () => {
        const findings = normalizeFindings(
            [
                {
                    level: 'error',
                    category: 'content',
                    file: 'packages/Marker.tsx',
                    ref,
                    message: `${ref}: ${message}`,
                },
                {
                    level: 'error',
                    file: 'scope-tours:generate',
                    message: `Error: ${message}`,
                },
            ],
            ['/tmp/docs'],
        );
        assert.equal(findings.length, 1);
        assert.equal(findings[0].category, 'content');
        assert.equal(findings[0].cause, cause);
        assert.equal(compareFindings(findings, findings).blocked, false);
    });
}

const workflow = readFileSync(
    new URL('./learn-walkthroughs.yml', import.meta.url),
    'utf8',
);
const step = workflow
    .split('      - name: Does this pull request touch a cited page?')[1]
    .split('\n      - name:')[0];
const script = step.split('        run: |\n')[1].replace(/^ {10}/gm, '');

for (const kind of [
    'rename',
    'navigation',
    'unrelated',
    'implementation',
    'workflow',
    'tests',
]) {
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
            const implementationPath = {
                implementation: 'learn-findings.mjs',
                workflow: 'learn-walkthroughs.yml',
                tests: 'learn-walkthroughs.test.mjs',
            }[kind];
            if (implementationPath) {
                mkdirSync(path.join(docs, '.github/workflows'), {
                    recursive: true,
                });
                writeFileSync(
                    path.join(docs, '.github/workflows', implementationPath),
                    'changed implementation',
                );
            }
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

for (const kind of [
    'citation',
    'navigation',
    'unchanged',
    'equal checker crash',
    'new checker crash',
    'equal generator crash',
    'new generator crash',
    'collector crash',
]) {
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
                mkdirSync(path.join(docs, '.github/workflows'), {
                    recursive: true,
                });
                writeFileSync(
                    path.join(docs, '.github/workflows/learn-findings.mjs'),
                    readFileSync(
                        new URL('./learn-findings.mjs', import.meta.url),
                    ),
                );
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
exports.findMarkers = () => [{file:'packages/Marker.tsx', scope:'test-scope', docs:'old.mdx#missing:1', resultDocs:'new.mdx#intro:1'}];
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
kind='${kind}'
if [[ "$kind" = *crash* ]] && { [[ "$kind" != new* ]] || [ "$(cat "$LIGHTDASH_DOCS_DIR/unrelated.mdx" 2>/dev/null || true)" = broken ]; }; then
  if { [[ "$kind" = *checker* ]] && [ "$1" = exec ] && [ "$3" = scripts/scope-tours/check.ts ]; } || { [[ "$kind" = *generator* ]] && [ "$1" = scope-tours:generate ]; } || { [[ "$kind" = collector* ]] && [ "$1" = exec ] && [ "$3" != scripts/scope-tours/check.ts ]; }; then
    echo 'TypeError: parser exploded' >&2
    exit 1
  fi
fi
if [ "$1" = exec ]; then
  if [ "$3" = scripts/scope-tours/check.ts ]; then echo '[{"level":"error","file":"scripts/scope-tours","message":"Docs anchor not found: old.mdx#missing:1"}]'; exit 1; fi
  node "$3"
elif [ "$1" = scope-tours:generate ]; then
  echo 'Error: Docs anchor not found: old.mdx#missing:1'; exit 1
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
                    .split('\n      - name:')[0]
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
                    kind.includes('crash')
                        ? /Tool failures \(comparison incomplete\)/
                        : kind === 'citation'
                          ? /new.mdx#intro/
                          : kind === 'navigation'
                            ? /Not in the docs sidebar/
                            : /No walkthrough validation error introduced/,
                );
                const report = JSON.parse(
                    readFileSync(path.join(cwd, 'comparison.json'), 'utf8'),
                );
                assert.equal(report.docsBaseSha, base);
                assert.equal(
                    report.docsHeadSha,
                    git(docs, 'rev-parse', 'HEAD'),
                );
                assert.equal(
                    report.productSha,
                    git(product, 'rev-parse', 'HEAD'),
                );
                const headReport = JSON.parse(
                    readFileSync(path.join(cwd, 'head-findings.json'), 'utf8'),
                );
                assert.equal(headReport.revision, 'head');
                assert.equal(headReport.productSha, report.productSha);
                if (kind.includes('crash')) {
                    assert.doesNotMatch(
                        readFileSync(path.join(cwd, 'summary'), 'utf8'),
                        /No walkthrough validation error introduced/,
                    );
                    assert.equal(report.blocked, true);
                    assert.deepEqual(report.repaired, []);
                    assert.ok(
                        report.toolFailures.some(
                            (finding) => finding.revision === 'head',
                        ),
                    );
                } else {
                    assert.deepEqual(report.toolFailures, []);
                    assert.equal(
                        headReport.findings.filter(
                            (finding) => finding.target === 'old.mdx#missing',
                        ).length,
                        1,
                    );
                    assert.equal(
                        headReport.findings.find(
                            (finding) => finding.target === 'old.mdx#missing',
                        ).owners[0].selector,
                        'test-scope',
                    );
                }
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
                path.join(cwd, 'revisions.json'),
                JSON.stringify({
                    productSha: 'product',
                    docsBaseSha: 'base',
                    docsHeadSha: 'head',
                }),
            );
            writeFileSync(
                path.join(cwd, 'base.json'),
                JSON.stringify(finding(['explore/spaces', 'explore/homepage'])),
            );
            writeFileSync(
                path.join(cwd, 'head.json'),
                JSON.stringify(finding(pages)),
            );
            const summary = path.join(cwd, 'summary');
            const result = spawnSync(
                'node',
                [new URL('./learn-findings.mjs', import.meta.url).pathname],
                {
                    cwd,
                    encoding: 'utf8',
                    env: { ...process.env, GITHUB_STEP_SUMMARY: summary },
                },
            );
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
