import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
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
import { runCheck } from './learn-citations.mjs';

for (const [kind, baseErrors, headErrors, guidance, status] of [
    ['clean success', [], [], false, 0],
    ['fully repaired citations', ['content'], [], false, 0],
    ['introduced citation failure', [], ['content'], true, 1],
    ['existing citation failure', ['content'], ['content'], false, 0],
    ['head tool failure', [], ['tool'], false, 1],
    ['base tool failure', ['tool'], [], false, 1],
]) {
    test(`rendered summary distinguishes repair guidance from checker errors: ${kind}`, () => {
        const cwd = mkdtempSync(path.join(tmpdir(), 'docs-learn-summary-'));
        try {
            writeFileSync(
                path.join(cwd, 'revisions.json'),
                JSON.stringify({
                    productSha: 'product',
                    docsBaseSha: 'base',
                    docsHeadSha: 'head',
                }),
            );
            for (const [revision, errors] of [
                ['base', baseErrors],
                ['head', headErrors],
            ])
                writeFileSync(
                    path.join(cwd, `${revision}.json`),
                    JSON.stringify(
                        errors.map((category) => ({
                            level: 'error',
                            category,
                            file: 'checker',
                            message:
                                category === 'content'
                                    ? 'Docs anchor not found: spaces.mdx#missing:1'
                                    : 'TypeError: parser crashed',
                        })),
                    ),
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
            const rendered = readFileSync(summary, 'utf8');
            for (const text of [
                'reference-only lightdash/lightdash PR',
                'Merge that PR, then rerun this docs check.',
            ])
                assert.equal(rendered.includes(text), guidance, rendered);
            assert.equal(
                rendered.includes(
                    'Citation extraction or resolution could not complete.',
                ),
                kind.includes('tool'),
                rendered,
            );
            if (status === 0)
                assert.match(
                    rendered,
                    /No broken documentation references introduced by this pull request\./,
                );
        } finally {
            rmSync(cwd, { recursive: true, force: true });
        }
    });
}

test('duplicate citations keep every product owner and selector changes remain distinct', () => {
    const row = {
        level: 'error',
        category: 'content',
        file: 'packages/Marker.tsx',
        line: 12,
        ref: 'spaces.mdx#intro:p2:2',
        message:
            'spaces.mdx#intro:p2:2: sentence range out of bounds (1 sentences)',
    };
    const base = normalizeFindings([row, { ...row, line: 20 }]);
    assert.equal(base.length, 1);
    assert.deepEqual(
        base[0].owners.map((owner) => owner.line),
        [12, 20],
    );
    const unchanged = normalizeFindings([
        {
            ...row,
            message: row.message.replace('(1 sentences)', '(0 sentences)'),
        },
    ]);
    assert.equal(compareFindings(base, unchanged).blocked, false);
    const introduced = normalizeFindings([
        {
            ...row,
            ref: 'spaces.mdx#intro:p3:2',
            message: row.message.replaceAll('p2', 'p3'),
        },
    ]);
    assert.equal(compareFindings(base, introduced).blocked, true);
});

for (const kind of [
    'introduced',
    'unchanged',
    'repaired',
    'unsupported',
    'missing page',
    'invalid base',
]) {
    test(`static check compares exact base/head revisions and reports ${kind}`, () => {
        const cwd = mkdtempSync(path.join(tmpdir(), 'learn-comparison-'));
        const docs = path.join(cwd, 'docs'),
            product = path.join(cwd, 'lightdash');
        const write = (root, name, text) => {
            const file = path.join(root, name);
            mkdirSync(path.dirname(file), { recursive: true });
            writeFileSync(file, text);
        };
        const git = (root, ...args) =>
            execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
        const commit = (root) => {
            git(root, 'add', '.');
            git(
                root,
                '-c',
                'user.name=Test',
                '-c',
                'user.email=test@example.com',
                'commit',
                '-qm',
                'fixture',
            );
        };
        const read = (name) =>
            JSON.parse(readFileSync(path.join(cwd, name), 'utf8'));
        try {
            write(
                product,
                'packages/frontend/src/Marker.tsx',
                `const Component = () => <Box data-tour-docs=${kind === 'unsupported' ? '{runtimeDocs()}' : '"page.mdx#intro:2"'} />;`,
            );
            for (const [name, symbol] of [
                ['sandboxLessons', 'SANDBOX_LESSONS'],
                ['codeLessons', 'CONTENT_AS_CODE_LESSONS'],
            ])
                write(
                    product,
                    `packages/frontend/src/features/learn/${name}.ts`,
                    `export const ${symbol} = [];`,
                );
            git(product, 'init', '-q');
            commit(product);
            const page = (broken) =>
                '---\ntitle: Page\n---\nOne sentence.' +
                (broken ? '' : ' Another sentence.') +
                '\n';
            write(
                docs,
                'page.mdx',
                page(kind === 'unchanged' || kind === 'repaired'),
            );
            git(docs, 'init', '-q');
            commit(docs);
            const baseSha = git(docs, 'rev-parse', 'HEAD');
            write(docs, 'page.mdx', page(kind !== 'repaired'));
            if (kind === 'missing page')
                renameSync(
                    path.join(docs, 'page.mdx'),
                    path.join(docs, 'moved.mdx'),
                );
            write(docs, 'other.mdx', 'changed');
            commit(docs);
            runCheck({
                product,
                docs,
                baseSha: kind === 'invalid base' ? 'bad-ref' : baseSha,
                output: cwd,
            });
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
            const blocked = !['unchanged', 'repaired'].includes(kind);
            assert.equal(
                result.status,
                blocked ? 1 : 0,
                result.stdout + result.stderr,
            );
            const inventory = read('citation-inventory.json');
            assert.equal(
                inventory.productSha,
                git(product, 'rev-parse', 'HEAD'),
            );
            assert.equal(inventory.docsHeadSha, git(docs, 'rev-parse', 'HEAD'));
            assert.equal(
                inventory.docsBaseSha,
                kind === 'invalid base' ? 'bad-ref' : baseSha,
            );
            assert.equal(
                inventory.count,
                ['unsupported', 'invalid base'].includes(kind) ? 0 : 1,
            );
            const report = read('comparison.json');
            assert.equal(report.blocked, blocked);
            assert.equal(
                report.introduced.length,
                ['introduced', 'missing page'].includes(kind) ? 1 : 0,
            );
            assert.equal(report.repaired.length, kind === 'repaired' ? 1 : 0);
            assert.equal(
                report.toolFailures.length > 0,
                ['unsupported', 'invalid base'].includes(kind),
            );
            const rendered = readFileSync(summary, 'utf8');
            if (kind === 'introduced') {
                assert.match(rendered, /page.mdx#intro:2/);
                assert.ok(
                    rendered.includes(
                        `https://github.com/lightdash/lightdash/blob/${inventory.productSha}/packages/frontend/src/Marker.tsx#L1`,
                    ),
                );
                assert.match(
                    rendered,
                    /reference-only lightdash\/lightdash PR/,
                );
            }
            assert.equal(git(docs, 'rev-parse', 'HEAD'), inventory.docsHeadSha);
            assert.equal(git(product, 'status', '--porcelain'), '');
            assert.equal(git(docs, 'status', '--porcelain'), '');
        } finally {
            rmSync(cwd, { recursive: true, force: true });
        }
    });
}
