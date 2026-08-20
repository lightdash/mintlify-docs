import assert from 'node:assert/strict';
import test from 'node:test';

import { fixImagePaths, wrapBareMedia } from '../scripts/docs/lib/fixes.ts';

test('rewrites relative image paths to root-relative', () => {
  const fix = fixImagePaths('workflow/cli/deploy.mdx', [
    '![A chart](../../images/workflow/chart.png)',
    '<img src="../images/cli/run.png" alt="A run" />',
  ].join('\n'));

  assert.equal(fix.applied, 2);
  // Resolved against the page's own directory, not blindly stripped.
  assert.match(fix.content, /!\[A chart\]\(\/images\/workflow\/chart\.png\)/);
  assert.match(fix.content, /src="\/workflow\/images\/cli\/run\.png"/);
});

test('leaves paths that already resolve, and ones that escape the root', () => {
  const rooted = fixImagePaths('a/b.mdx', '![x](/images/a/x.png)');
  assert.equal(rooted.applied, 0);

  const escaping = fixImagePaths('a/b.mdx', '![x](../../../outside.png)');
  assert.equal(escaping.applied, 0);
  assert.match(escaping.content, /\.\.\/\.\.\/\.\.\/outside\.png/);
});

test('wraps block-level media and preserves indentation', () => {
  const fix = wrapBareMedia([
    'Intro.',
    '',
    '![A chart](/images/a.png)',
    '',
    '<Step title="Open it">',
    '  <img src="/images/b.png" alt="B" />',
    '</Step>',
  ].join('\n'));

  assert.equal(fix.applied, 2);
  assert.deepEqual(fix.skipped, []);
  assert.match(fix.content, /<Frame>\n!\[A chart\]\(\/images\/a\.png\)\n<\/Frame>/);
  assert.match(fix.content, / {2}<Frame>\n {2}<img src="\/images\/b\.png" alt="B" \/>\n {2}<\/Frame>/);
});

test('wraps an element spread across several lines', () => {
  const fix = wrapBareMedia(['<img', '  src="/images/a.png"', '  alt="A"', '/>'].join('\n'));

  assert.equal(fix.applied, 1);
  assert.equal(fix.content.split('\n').at(0), '<Frame>');
  assert.equal(fix.content.split('\n').at(-1), '</Frame>');
});

test('wraps an iframe by its closing tag, not the first angle bracket', () => {
  const fix = wrapBareMedia('<iframe src="https://example.com/x"\n  height="420"></iframe>');

  assert.equal(fix.applied, 1);
  assert.equal(fix.content.split('\n').length, 4);
  assert.match(fix.content, /^<Frame>\n<iframe[\s\S]*<\/iframe>\n<\/Frame>$/);
});

test('leaves media already inside a Frame alone', () => {
  const framed = '<Frame>\n  <img src="/images/a.png" alt="A" />\n</Frame>';
  assert.equal(wrapBareMedia(framed).applied, 0);
  assert.equal(wrapBareMedia(framed).content, framed);
});

test('reports media whose context makes wrapping a judgment call', () => {
  const fix = wrapBareMedia([
    '| Chart | ![x](/images/a.png) |',
    '- ![y](/images/b.png)',
    '[![z](/images/c.png)](https://example.com)',
  ].join('\n'));

  assert.equal(fix.applied, 0);
  assert.deepEqual(fix.skipped.map(({ reason }) => reason), [
    'table cell', 'list item', 'wrapped in a link',
  ]);
});

test('ignores media named inside code', () => {
  const fenced = '```mdx\n![x](../images/a.png)\n```';
  assert.equal(wrapBareMedia(fenced).applied, 0);
  assert.equal(wrapBareMedia('Use `<iframe>` for embedding.').applied, 0);
});
