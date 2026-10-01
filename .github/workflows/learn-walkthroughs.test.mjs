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
