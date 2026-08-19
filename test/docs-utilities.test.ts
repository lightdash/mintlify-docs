import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { fixImageLocations } from '../scripts/docs/fix-image-locations.ts';
import { renderIaMap } from '../scripts/docs/render-ia-map.ts';
import { normalizeHandle, resolvePullRequestReference } from '../scripts/github/lib/pr-assignment.ts';

function fixture(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-utilities-'));
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return root;
}

test('relocates a page image and updates its reference', (t) => {
  const root = fixture({
    'guide/page.mdx': '![Chart](/images/other/chart.png)\n',
    'images/other/chart.png': 'image',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const result = fixImageLocations({ root });

  assert.equal(result.fixes.length, 1);
  assert.equal(fs.existsSync(path.join(root, 'images/guide/page/chart.png')), true);
  assert.equal(fs.readFileSync(path.join(root, 'guide/page.mdx'), 'utf8'), '![Chart](../images/guide/page/chart.png)\n');
});

test('reports IA annotation gaps without exiting from library code', (t) => {
  const root = fixture({
    'docs.json': JSON.stringify({ navigation: { groups: [{ group: 'Guides', root: 'guide', pages: [] }] } }),
    '.mintlify/ia-map.yml': '',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const result = renderIaMap({ root });

  assert.deepEqual(result.unannotated, ['guide']);
  assert.deepEqual(result.orphans, []);
  assert.match(result.output, /no annotation/);
});

test('normalizes assignment aliases and resolves contextual source PRs', () => {
  assert.equal(normalizeHandle('Tatiana-Inama'), 'tatianainama');
  assert.deepEqual(
    resolvePullRequestReference('Follow-up to #12345 with documentation.'),
    { number: 12345, reason: 'body contextual source reference' },
  );
});
