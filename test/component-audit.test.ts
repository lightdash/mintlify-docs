import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  advisoryWorkflowFindings,
  auditComponents,
  regressions,
  readBaseline,
  writeBaseline,
} from '../scripts/docs/audit-components.ts';
import { BLOCKING_RULES } from '../scripts/docs/lib/components.ts';
import { validateDocs } from '../scripts/docs/validate.ts';
import { groupIcons } from '../scripts/docs/lib/navigation.ts';
import {
  adjacentCallouts,
  allowsPageIcon,
  componentRegions,
  headingsInCallouts,
  isInside,
  labelDrift,
  markdownTables,
  describeProblem,
  maturityMarks,
  badgeProblems,
  BADGE_TAXONOMY,
  MATURITY_LEVELS,
  restatedStatuses,
  unbadgedStatuses,
  tabsBlocks,
  ungroupedAccordions,
} from '../scripts/docs/lib/components.ts';

function fixture(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'component-audit-'));
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return root;
}

function page(body: string, frontmatter = ''): string {
  return `---\ntitle: Page\ndescription: A complete page.\n${frontmatter}---\n\n${body}\n`;
}

const NAV = (pages: string[]) => JSON.stringify({ navigation: { pages } });

test('treats component syntax inside code fences as example text', () => {
  const content = [
    '<Frame>',
    '  <img src="/images/a.png" alt="A" />',
    '</Frame>',
    '',
    '```mdx',
    '<iframe src="https://example.com" />',
    '![](../images/b.png)',
    '```',
  ].join('\n');

  const report = auditComponents({
    root: fixture({ 'docs.json': NAV(['index']), 'index.mdx': page(content) }),
  });
  assert.deepEqual(report.findings, []);
});

test('flags media that escapes the column or cannot be described', () => {
  const content = [
    '<iframe src="https://www.youtube.com/embed/x" />',
    '',
    '<img src="../images/loose.png" />',
  ].join('\n');

  const report = auditComponents({
    root: fixture({ 'docs.json': NAV(['index']), 'index.mdx': page(content) }),
  });
  const rules = new Set(report.findings.map(({ rule }) => rule));

  assert.equal(report.status, 'advisory');
  assert.deepEqual(rules, new Set([
    'media.unframed-iframe',
    'media.unframed-image',
    'media.relative-path',
    'media.missing-alt',
  ]));
  assert.ok(report.findings.every(({ severity }) => severity === 'warning'));
});

test('a framed image with alt text and a root-relative path passes', () => {
  const report = auditComponents({
    root: fixture({
      'docs.json': NAV(['index']),
      'index.mdx': page('<Frame>\n  <img src="/images/index/a.png" alt="The chart config panel" />\n</Frame>'),
    }),
  });
  assert.deepEqual(report.findings, []);
});

test('rejects icon names the Tabler library does not define', () => {
  const report = auditComponents({
    root: fixture({
      'docs.json': NAV(['index']),
      'index.mdx': page('<Icon icon="check" /> and <Icon icon="xmark" iconType="solid" />'),
    }),
  });
  const rules = report.findings.map(({ rule }) => rule).sort();

  assert.deepEqual(rules, ['icon.font-awesome-prop', 'icon.unknown']);
  assert.equal(report.findings.find(({ rule }) => rule === 'icon.unknown')?.target, 'xmark');
});

test('checks frontmatter icons, which drive the sidebar and card listings', () => {
  const root = fixture({
    'docs.json': NAV(['good', 'bad', 'custom']),
    'good.mdx': page('Body.', 'icon: "chart-treemap"\n'),
    'bad.mdx': page('Body.', 'icon: chart-tree-map\n'),
    'custom.mdx': page('Body.', 'icon: "/images/custom.svg"\n'),
  });

  const findings = auditComponents({ root }).findings.filter(({ rule }) => rule === 'icon.unknown');
  assert.deepEqual(findings.map(({ file, target }) => [file, target]), [['bad.mdx', 'chart-tree-map']]);
});

test('allows page icons only inside a documented carve-out', () => {
  assert.equal(allowsPageIcon('explore/chart-types/sankey.mdx'), true);
  assert.equal(allowsPageIcon('integrations/dbt.mdx'), false);
  assert.equal(allowsPageIcon('explore/chart-types/nested/deep.mdx'), false);

  const root = fixture({
    'docs.json': NAV(['explore/chart-types/sankey', 'integrations/dbt']),
    'explore/chart-types/sankey.mdx': page('Body.', 'icon: "chart-sankey"\n'),
    'integrations/dbt.mdx': page('Body.', 'icon: "hierarchy-2"\n'),
  });

  const findings = auditComponents({ root }).findings
    .filter(({ rule }) => rule === 'icon.unsanctioned-page');
  assert.deepEqual(findings.map(({ file }) => file), ['integrations/dbt.mdx']);
});

test('reads group icons with their depth so only areas may carry one', () => {
  const docs = {
    navigation: {
      tabs: [{
        tab: 'Docs',
        pages: [{
          group: 'Explore',
          icon: 'telescope',
          pages: [{ group: 'Chart types', icon: 'chart-bar', pages: ['a'] }],
        }],
      }],
    },
  };

  assert.deepEqual(groupIcons(docs), [
    { group: 'Explore', icon: 'telescope', depth: 0 },
    { group: 'Chart types', icon: 'chart-bar', depth: 1 },
  ]);
});

test('flags an icon on a nested navigation group', () => {
  const root = fixture({
    'docs.json': JSON.stringify({
      navigation: {
        tabs: [{
          tab: 'Docs',
          pages: [{
            group: 'Explore',
            icon: 'telescope',
            pages: [{ group: 'Chart types', icon: 'chart-bar', pages: ['index'] }],
          }],
        }],
      },
    }),
    'index.mdx': page('Body.'),
  });

  const findings = auditComponents({ root }).findings
    .filter(({ rule }) => rule === 'icon.unsanctioned-group');
  assert.deepEqual(findings.map(({ target }) => target), ['Chart types']);
});

test('reads a maturity level only where the page cites the maturity guide', () => {
  const lightdash = '<Info>\n  Autopilot is a [Beta](/support/feature-maturity-levels) feature.\n</Info>';
  const thirdParty = '<Note>\n  Azure Container Apps is currently an Azure **preview** feature.\n</Note>';
  const comparison = 'Availability is separate from [maturity](/support/feature-maturity-levels): '
    + 'a feature can be Experimental or Beta and Enterprise-only, or GA and available to everybody.';

  assert.deepEqual(maturityMarks(lightdash).map(({ level }) => level), ['Beta']);
  assert.deepEqual(maturityMarks(thirdParty), []);
  assert.deepEqual(maturityMarks(comparison), []);
});

test('a non-GA page needs its level in frontmatter for the sidebar pill', () => {
  const gate = '<Info>\n  Pre-aggregates are a [Beta](/support/feature-maturity-levels) feature.\n</Info>';
  const root = fixture({
    'docs.json': NAV(['untagged', 'tagged', 'mismatched']),
    'untagged.mdx': page(gate),
    'tagged.mdx': page(gate, 'tag: "Beta"\n'),
    'mismatched.mdx': page(gate, 'tag: "Experimental"\n'),
  });

  const byFile = new Map(auditComponents({ root }).findings
    .filter(({ rule }) => rule === 'lifecycle.missing-tag' || rule === 'lifecycle.tag-mismatch')
    .map((f) => [f.file, f.rule]));
  assert.equal(byFile.get('untagged.mdx'), 'lifecycle.missing-tag');
  assert.equal(byFile.get('mismatched.mdx'), 'lifecycle.tag-mismatch');
  assert.equal(byFile.has('tagged.mdx'), false);
});

test('wants the status worn as a badge, not linked in the prose', () => {
  const linked = '<Info>\n  **Availability:** A [Beta](/support/feature-maturity-levels) feature.\n</Info>';
  const badged = '<Info>\n  <Badge color="purple" size="sm" shape="pill">Beta</Badge> Available on all plans. '
    + '[What Beta means](/support/feature-maturity-levels).\n</Info>';

  assert.deepEqual(unbadgedStatuses(linked), [1]);
  assert.deepEqual(unbadgedStatuses(badged), []);
});

test('holds every badge to one colour, icon, and size', () => {
  const right = '<Badge icon="flask" color="purple" size="sm" shape="pill">Beta</Badge>';
  assert.deepEqual(badgeProblems(right), []);

  const wrong = '<Badge icon="flask" color="green" size="md" shape="pill">Beta</Badge>';
  assert.equal(badgeProblems(wrong).at(0)?.detail, 'wants color="purple" size="sm"');

  // A label outside the taxonomy is left alone rather than guessed at.
  assert.deepEqual(badgeProblems('<Badge color="gray" size="sm" shape="pill">Coming soon</Badge>'), []);
});

test('refuses a badge that is a link', () => {
  const linked = '<Badge icon="flask" color="purple" size="sm" shape="pill">[Beta](/support/x)</Badge>';
  assert.equal(badgeProblems(linked).at(0)?.detail, 'a badge is a label, not a link');
});

test('spends one colour per axis so the set stays learnable', () => {
  // Derived from the taxonomy, so adding or retiring a badge cannot quietly
  // break the axes this asserts.
  const lifecycle = [...MATURITY_LEVELS];
  const availability = Object.keys(BADGE_TAXONOMY)
    .filter((label) => !(lifecycle as string[]).includes(label));

  assert.ok(availability.length > 0);
  assert.ok(availability.every((k) => BADGE_TAXONOMY[k]?.color === 'blue'),
    'availability reads as one colour, distinguished by icon');

  const colours = new Set(lifecycle.map((k) => BADGE_TAXONOMY[k]?.color));
  assert.equal(colours.size, lifecycle.length, 'each lifecycle stage reads as distinct');
  assert.equal(colours.has('blue'), false, 'lifecycle never borrows the availability colour');

  const icons = Object.values(BADGE_TAXONOMY).map(({ icon }) => icon);
  assert.equal(new Set(icons).size, icons.length, 'no two badges share an icon');
});

test('flags a sentence that repeats its own badge', () => {
  const twice = '<Badge color="purple" size="sm" shape="pill">Beta</Badge> Agent memory is a Beta feature.';
  const once = '<Badge color="purple" size="sm" shape="pill">Beta</Badge> Available wherever agents are. '
    + '[What Beta means](/support/feature-maturity-levels).';

  assert.deepEqual(restatedStatuses(twice), [1]);
  assert.deepEqual(restatedStatuses(once), []);
});

test('holds descriptions to one short sentence', () => {
  assert.equal(describeProblem('Every option for defining and configuring dimensions in YAML'), undefined);
  assert.equal(describeProblem('a'.repeat(101))?.length, 101);
  assert.equal(describeProblem('Short enough. But it is two sentences.')?.sentences, 2);
});

test('reads a level below the first heading as a section mark, not the page', () => {
  const gate = '<Info>\n  A [Beta](/support/feature-maturity-levels) feature.\n</Info>';
  const root = fixture({
    'docs.json': NAV(['index']),
    'index.mdx': page(`Intro prose.\n\n## One option\n\n${gate}`),
  });

  const rules = auditComponents({ root }).findings.map(({ rule }) => rule);
  assert.equal(rules.includes('lifecycle.missing-tag'), false);
});

test('inherits a maturity level from an imported availability snippet', () => {
  const root = fixture({
    'docs.json': NAV(['index']),
    'snippets/availability.mdx': '<Info>\n  A [Beta](/support/feature-maturity-levels) feature.\n</Info>',
    'index.mdx': page("import Availability from '/snippets/availability.mdx';\n\n<Availability />"),
  });

  const report = auditComponents({ root });
  assert.deepEqual(
    report.findings.filter(({ file }) => file === 'index.mdx').map(({ rule }) => rule),
    ['lifecycle.missing-tag'],
  );
});

test('names bold lifecycle text as a badge that should exist', () => {
  const report = auditComponents({
    root: fixture({ 'docs.json': NAV(['index']), 'index.mdx': page('**Beta:** this ships soon.') }),
  });
  assert.equal(report.findings.at(0)?.rule, 'lifecycle.text-marker');
});

test('reads tab panels that hold only a code block as a code group', () => {
  const codeOnly = tabsBlocks('<Tabs>\n<Tab title="npm">\n```bash\nnpm i\n```\n</Tab>\n</Tabs>');
  const mixed = tabsBlocks('<Tabs>\n<Tab title="npm">\nRun this first.\n\n```bash\nnpm i\n```\n</Tab>\n</Tabs>');

  assert.equal(codeOnly.at(0)?.codeOnly, true);
  assert.equal(mixed.at(0)?.codeOnly, false);
  assert.deepEqual(codeOnly.at(0)?.labels, ['npm']);
});

test('separates a truncated sync label from a genuinely different alternative', () => {
  assert.equal(labelDrift('dbt v1.9'), 'dbt v1.9 and earlier');
  assert.equal(labelDrift('dbt v1.10+'), undefined);
  assert.equal(labelDrift('Docker Compose'), undefined);
  assert.equal(labelDrift('Windsurf'), undefined);
});

test('tracks which component encloses a line', () => {
  const regions = componentRegions('<Frame>\n<img src="/a.png" alt="A" />\n</Frame>\n<img src="/b.png" alt="B" />');
  assert.equal(isInside(regions, 'Frame', 2), true);
  assert.equal(isInside(regions, 'Frame', 4), false);
});

test('flags callouts that stack and callouts that grew a heading', () => {
  assert.deepEqual(adjacentCallouts('<Note>\nOne.\n</Note>\n\n<Warning>\nTwo.\n</Warning>'), [5]);
  assert.deepEqual(adjacentCallouts('<Note>\nOne.\n</Note>\n\nProse.\n\n<Warning>\nTwo.\n</Warning>'), []);
  assert.deepEqual(headingsInCallouts('<Callout icon="ship">\n### Deploy\n</Callout>'), [2]);
});

test('flags sibling accordions that are not one set', () => {
  const loose = '<Accordion title="A">\na\n</Accordion>\n\n<Accordion title="B">\nb\n</Accordion>';
  const grouped = `<AccordionGroup>\n${loose}\n</AccordionGroup>`;

  assert.deepEqual(ungroupedAccordions(loose), [1]);
  assert.deepEqual(ungroupedAccordions(grouped), []);
});

test('separates a wide prose table from a glyph matrix', () => {
  const prose = [
    '| Surface | Best for | User | Governance | Learn more |',
    '| --- | --- | --- | --- | --- |',
    '| AI agents | Governed self-serve questions | Business user | Agent tag scope | [Using AI agents](/a) |',
  ].join('\n');
  const matrix = [
    '| Permission | Viewer | Editor | Developer | Admin |',
    '| --- | --- | --- | --- | --- |',
    '| View | <Icon icon="check" /> | <Icon icon="check" /> | <Icon icon="check" /> | <Icon icon="check" /> |',
  ].join('\n');

  assert.equal(markdownTables(prose).at(0)?.isMatrix, false);
  assert.equal(markdownTables(matrix).at(0)?.isMatrix, true);
  assert.equal(markdownTables(matrix).at(0)?.columns, 5);
  assert.equal(markdownTables(`<div className="sticky-first-col">\n\n${matrix}`).at(0)?.pinned, true);
});

test('flags tables that will scroll sideways, and exempts pinned matrices', () => {
  const matrix = [
    '| Permission | Viewer | Editor | Developer | Admin |',
    '| --- | --- | --- | --- | --- |',
    '| View | <Icon icon="check" /> | <Icon icon="check" /> | <Icon icon="check" /> | <Icon icon="check" /> |',
  ].join('\n');
  const prose = [
    '| Surface | Best for | User | Governance | Learn more |',
    '| --- | --- | --- | --- | --- |',
    '| AI agents | Governed self-serve questions | Business user | Agent tag scope | [Using AI agents](/a) |',
  ].join('\n');
  const narrow = '| Surface | Best for |\n| --- | --- |\n| AI agents | Governed self-serve questions here |';

  const root = fixture({
    'docs.json': NAV(['wide', 'loose', 'pinned', 'narrow']),
    'wide.mdx': page(prose),
    'loose.mdx': page(matrix),
    'pinned.mdx': page(`<div className="sticky-first-col">\n\n${matrix}\n\n</div>`),
    'narrow.mdx': page(narrow),
  });

  const byFile = new Map(auditComponents({ root }).findings
    .filter(({ rule }) => rule.startsWith('table.'))
    .map((f) => [f.file, f.rule]));

  assert.equal(byFile.get('wide.mdx'), 'table.too-many-columns');
  assert.equal(byFile.get('loose.mdx'), 'table.unpinned');
  assert.equal(byFile.has('pinned.mdx'), false);
  assert.equal(byFile.has('narrow.mdx'), false);
});

test('lets a reference lookup keep its columns, but still makes it pin', () => {
  const prose = [
    '| Option | Type | Default | Applies to | Notes |',
    '| --- | --- | --- | --- | --- |',
    '| round | number | none | numeric dimensions | Decimal places to display in the UI |',
  ].join('\n');

  const root = fixture({
    'docs.json': NAV(['lookup', 'pinned-lookup', 'guide']),
    'lookup.mdx': page(prose, 'doc-type: reference\n'),
    'pinned-lookup.mdx': page(`<div className="sticky-first-col">\n\n${prose}\n\n</div>`, 'doc-type: reference\n'),
    'guide.mdx': page(prose, 'doc-type: guide\n'),
  });

  const byFile = new Map(auditComponents({ root }).findings
    .filter(({ rule }) => rule.startsWith('table.'))
    .map((f) => [f.file, f.rule]));

  assert.equal(byFile.get('lookup.mdx'), 'table.unpinned');
  assert.equal(byFile.get('guide.mdx'), 'table.too-many-columns');
  assert.equal(byFile.has('pinned-lookup.mdx'), false);
});

test('summarises findings by rule and by product area', () => {
  const report = auditComponents({
    root: fixture({
      'docs.json': NAV(['explore/charts', 'agents/index']),
      'explore/charts.mdx': page('<img src="../images/a.png" />'),
      'agents/index.mdx': page('<img src="/images/agents/index/b.png" />'),
    }),
  });

  assert.equal(report.summary.byArea.explore, 3);
  assert.equal(report.summary.byArea.agents, 2);
  assert.equal(report.summary.byRule['media.relative-path'], 1);
  assert.equal(report.summary.warnings, report.findings.length);
});

test('ratchets rule counts down, never up', () => {
  const baseline = { rules: { 'media.missing-alt': 5, 'tabs.code-only': 2 } };

  assert.deepEqual(regressions(baseline, { 'media.missing-alt': 5, 'tabs.code-only': 2 }), []);
  assert.deepEqual(regressions(baseline, { 'media.missing-alt': 3 }), []);
  assert.deepEqual(regressions(baseline, { 'media.missing-alt': 6, 'tabs.code-only': 2 }), [
    { rule: 'media.missing-alt', baseline: 5, current: 6 },
  ]);
  // A rule absent from the baseline starts at zero, so its first finding regresses.
  assert.deepEqual(regressions(baseline, { 'icon.unknown': 1 }), [
    { rule: 'icon.unknown', baseline: 0, current: 1 },
  ]);
});

test('round-trips a baseline through disk', () => {
  const root = fixture({ 'docs.json': NAV([]) });
  assert.deepEqual(readBaseline(root).rules, {});
  writeBaseline(root, { 'b.rule': 2, 'a.rule': 1 });
  assert.deepEqual(readBaseline(root).rules, { 'a.rule': 1, 'b.rule': 2 });
});

test('promotes exactly the blocking rules into the validator', async () => {
  const root = fixture({
    'docs.json': NAV(['broken']),
    'broken.mdx': page('<img src="../images/a.png" />', 'icon: "not-a-tabler-icon"\n'),
  });

  const audited = auditComponents({ root }).findings.map(({ rule }) => rule);
  const validated = (await validateDocs({ root })).findings.map(({ rule }) => rule);

  // Whatever the audit found, the validator carries over the blocking rules and
  // nothing else. Stays true as rules graduate into BLOCKING_RULES.
  const expected = audited.filter((rule) => BLOCKING_RULES.has(rule));
  assert.ok(expected.length > 0, 'fixture should trip at least one blocking rule');
  for (const rule of expected) assert.ok(validated.includes(rule), `${rule} should block`);
  for (const rule of validated) {
    if (rule.startsWith('icon.') || rule.startsWith('media.') || rule.startsWith('table.')
      || rule.startsWith('tabs.') || rule.startsWith('callout.') || rule.startsWith('lifecycle.')
      || rule.startsWith('accordion.')) {
      assert.ok(BLOCKING_RULES.has(rule), `${rule} should not block`);
    }
  }
  const promoted = validated.filter((rule) => BLOCKING_RULES.has(rule));
  const carried = (await validateDocs({ root })).findings.filter((f) => promoted.includes(f.rule));
  assert.ok(carried.every(({ severity }) => severity === 'error'), 'promoted findings block');
});

test('annotates blocking component findings only through the validator', () => {
  const gate = '<Info>\n  A [Beta](/support/feature-maturity-levels) feature.\n</Info>';
  const root = fixture({
    'docs.json': NAV(['blocking', 'advisory']),
    'blocking.mdx': page(gate),
    'advisory.mdx': page(gate, 'tag: "Experimental"\n'),
  });

  const findings = advisoryWorkflowFindings(auditComponents({ root }).findings);
  assert.deepEqual(findings.map(({ rule }) => rule), ['lifecycle.tag-mismatch']);
});

test('scopes blocking component findings to the files a change touched', async () => {
  const root = fixture({
    'docs.json': NAV(['broken', 'untouched']),
    'broken.mdx': page('Body.', 'icon: "not-a-tabler-icon"\n'),
    'untouched.mdx': page('Body.'),
  });

  const scoped = await validateDocs({ root, changedFiles: ['untouched.mdx'] });
  assert.equal(scoped.findings.some((f) => f.rule === 'icon.unknown'), false);

  const touched = await validateDocs({ root, changedFiles: ['broken.mdx'] });
  assert.equal(touched.findings.some((f) => f.rule === 'icon.unknown'), true);
});
