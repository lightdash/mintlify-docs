import assert from 'node:assert/strict';
import {
    mkdtempSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
    rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
    checkCitations,
    collectCitations,
    validateCitation,
} from './learn-citations.mjs';

test('inventory resolves markers and every lesson citation with exact use-site locations without executing source', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'learn-inventory-'));
    const write = (name, text) => {
        const file = path.join(root, 'packages/frontend/src', name);
        mkdirSync(path.dirname(file), { recursive: true });
        writeFileSync(file, text);
    };
    try {
        write(
            'Marker.tsx',
            `throw new Error('source must never execute');
const PAGE = 'explore/spaces.mdx';
const Component = () => <Box
    data-tour-docs={\`\${PAGE}#intro:1\`}
    data-tour-result-docs="explore/spaces.mdx#result:1"
    {...{'data-tour-resultdocs': 'explore/spaces.mdx#result:2'}}
/>;`,
        );
        write(
            'features/learn/sandboxLessons.ts',
            `import 'unavailable-product-dependency';
const SHIP = ['workflow/ci.mdx#intro:1', 'workflow/ci.mdx#intro:p2:2'];
export const SANDBOX_LESSONS = [{
    docs: 'semantic-layer/metrics.mdx',
    intro: 'semantic-layer/metrics.mdx#intro:1',
    shipDocs: SHIP,
    snippet: 'not a citation',
}];`,
        );
        write(
            'features/learn/codeLessons.ts',
            `const PAGE = 'workflow/content-as-code.mdx';
export const CONTENT_AS_CODE_LESSONS = [{
    intro: \`\${PAGE}#intro:1\`,
    download: { docs: [\`\${PAGE}#download:1\`, \`\${PAGE}#download:2\`], outputDocs: \`\${PAGE}#output:1\` },
    edit: { docs: \`\${PAGE}#edit:1\` },
    upload: { docs: \`\${PAGE}#upload:1\`, outputDocs: \`\${PAGE}#upload:2\` },
    resultDocs: \`\${PAGE}#result:1\`,
}];`,
        );
        const citations = collectCitations(root);
        assert.equal(citations.length, 15);
        assert.deepEqual(
            citations.find((item) => item.ref.endsWith('#result:2')),
            {
                file: 'packages/frontend/src/Marker.tsx',
                line: 6,
                ref: 'explore/spaces.mdx#result:2',
            },
        );
        assert.deepEqual(
            citations.filter((item) => item.ref.startsWith('workflow/ci')),
            [
                {
                    file: 'packages/frontend/src/features/learn/sandboxLessons.ts',
                    line: 6,
                    ref: 'workflow/ci.mdx#intro:1',
                },
                {
                    file: 'packages/frontend/src/features/learn/sandboxLessons.ts',
                    line: 6,
                    ref: 'workflow/ci.mdx#intro:p2:2',
                },
            ],
        );
        assert.equal(
            citations.filter((item) => item.file.endsWith('codeLessons.ts'))
                .length,
            8,
        );
        write(
            'Marker.tsx',
            'const Component = () => <Box data-tour-docs={getDocs()} />;',
        );
        assert.throws(
            () => collectCitations(root),
            /Marker\.tsx:1.*Unsupported citation expression/,
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

const page = `---
title: Homepage
---
An intro sentence.

## 1. Pin content

<Frame>image</Frame>

First sentence. Select **Pin to homepage** from the menu. A **table.field** stays one sentence. See [sharing](https://example.com/a.b) for details. ***Editors*** can pin, and *only they* can unpin.

Second paragraph. Another sentence.

- First item
- **Second item**. Another item sentence.

### Child heading

Child content.

## Name it

Give it a memorable name
`;

for (const selector of [
    'intro:1',
    '1-pin-content:1',
    '1-pin-content:5',
    '1-pin-content:p2:2',
    '1-pin-content:li2:2',
    'name-it:1',
    '1-pin-content:2-99',
]) {
    test(`citation selector matches product parser acceptance: ${selector}`, () => {
        assert.doesNotThrow(() =>
            validateCitation(`page.mdx#${selector}`, () => page),
        );
    });
}
for (const [selector, error] of [
    ['missing:1', /anchor not found/],
    ['1-pin-content:p3', /paragraph 3 not found/],
    ['1-pin-content:li3', /list item 3 not found/],
    ['1-pin-content:6', /sentence range out of bounds/],
    ['1-pin-content:p2:3', /sentence range out of bounds/],
    ['1-pin-content:li2:3', /sentence range out of bounds/],
]) {
    test(`citation selector reports broken target: ${selector}`, () => {
        assert.throws(
            () => validateCitation(`page.mdx#${selector}`, () => page),
            error,
        );
    });
}

test('page-only references check existence; intro requires a title and frontmatter', () => {
    assert.doesNotThrow(() => validateCitation('page.mdx', () => page));
    assert.throws(
        () => validateCitation('page.mdx#intro:1', () => '## Heading\nText.'),
        /title/,
    );
    assert.throws(
        () =>
            validateCitation('page.mdx', () => {
                const error = new Error('missing');
                error.code = 'ENOENT';
                throw error;
            }),
        /missing/,
    );
});

test('paragraph and sentence boundaries follow product normalization rather than rendered MDX', () => {
    assert.throws(
        () =>
            validateCitation(
                'page.mdx#intro:1',
                () =>
                    '---\ntitle: Page\n---\nimport X from "x";\n\n<Info>Hi</Info>\n\n- List only',
            ),
        /paragraph 1 not found/,
    );
    assert.throws(
        () =>
            validateCitation(
                'page.mdx#intro:2',
                () =>
                    '---\ntitle: Page\n---\nOpen `Settings \\> My apps` with **bold.**',
            ),
        /sentence range out of bounds/,
    );
    assert.throws(
        () =>
            validateCitation(
                'page.mdx#intro:1',
                () => '---\ntitle: Page\n---\nAn unfinished table.field',
            ),
        /No sentences/,
    );
});

test('code fences count as paragraphs, nested headings end sections, and duplicate headings select the first', () => {
    const content =
        '## Flags --x ---charts\n\nFirst.\n\n```sh\nlightdash download\n```\n\nThird.\n\n##### Child\n\nNested.\n\n## Flags --x ---charts\n\nDuplicate. More.';
    assert.doesNotThrow(() =>
        validateCitation('page.mdx#flags---x----charts:p3:1', () => content),
    );
    assert.throws(
        () =>
            validateCitation('page.mdx#flags---x----charts:p4', () => content),
        /paragraph 4 not found/,
    );
    assert.throws(
        () => validateCitation('page.mdx#flags---x----charts:2', () => content),
        /sentence range out of bounds/,
    );
});

test('resolution crashes stay tool failures even when identical in both revisions', () => {
    const findings = checkCitations(
        [{ file: 'packages/Marker.tsx', line: 2, ref: 'page.mdx#intro:1' }],
        () => {
            throw new TypeError('reader crashed');
        },
    );
    assert.equal(findings[0].category, 'tool');
    assert.equal(findings[0].message, 'reader crashed');
    const plain = checkCitations(
        [{ file: 'packages/Marker.tsx', line: 2, ref: 'page.mdx#intro:1' }],
        () => {
            throw new Error('git reader failed');
        },
    );
    assert.equal(plain[0].category, 'tool');
});
