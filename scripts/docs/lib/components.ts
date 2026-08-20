import { lineOf, withoutCodeBlocks } from './content.ts';
import iconNames from './tabler-icons.json' with { type: 'json' };

export const TABLER_ICONS = new Set<string>(iconNames);

/** Levels a Lightdash feature can be marked with. GA is the unmarked default. */
export const MATURITY_LEVELS = ['Experimental', 'Beta', 'Deprecated'] as const;
export type MaturityLevel = (typeof MATURITY_LEVELS)[number];

export const MATURITY_PAGE = 'support/feature-maturity-levels';

/**
 * Directories whose child pages carry their own icon. Icons otherwise belong to
 * top-level areas only, in docs.json — a lone icon on one subsection reads as a
 * rendering fault rather than a distinction.
 */
export const ICON_CARVE_OUTS = ['explore/chart-types'];

export function allowsPageIcon(file: string): boolean {
  const directory = file.replace(/\/[^/]*$/, '');
  return ICON_CARVE_OUTS.includes(directory);
}

/** Callout variants that carry their own icon and colour. */
export const TYPED_CALLOUTS = ['Note', 'Tip', 'Info', 'Warning', 'Check', 'Danger'] as const;

/**
 * Labels that sync tabs and code groups across a page. Mintlify matches them
 * exactly, so a near-miss silently breaks syncing.
 */
export const CANONICAL_LABELS: Record<string, string[]> = {
  'dbt version': ['dbt v1.10+', 'dbt v1.9 and earlier'],
  'config surface': ['Lightdash YAML', 'dbt YAML'],
  'install method': ['npm', 'Homebrew', 'Docker', 'Docker Compose'],
  deployment: ['Lightdash Cloud', 'Self-hosted'],
};

const OPEN_TAG = /<([A-Z][A-Za-z]*)(\s[^>]*?)?(\/?)>/g;
const CLOSE_TAG = /<\/([A-Z][A-Za-z]*)>/g;

export interface Region {
  tag: string;
  startLine: number;
  endLine: number;
}

/**
 * Regions covered by each container component, outermost first. Code fences are
 * blanked before scanning so component syntax inside examples is not counted.
 */
export function componentRegions(content: string): Region[] {
  const clean = withoutCodeBlocks(content);
  const regions: Region[] = [];
  const open: { tag: string; line: number }[] = [];
  const events: { line: number; tag: string; kind: 'open' | 'close' }[] = [];

  for (const match of clean.matchAll(OPEN_TAG)) {
    if (match[1] === undefined || match.index === undefined) continue;
    if (match[3] === '/') continue;
    events.push({ line: lineOf(clean, match.index), tag: match[1], kind: 'open' });
  }
  for (const match of clean.matchAll(CLOSE_TAG)) {
    if (match[1] === undefined || match.index === undefined) continue;
    events.push({ line: lineOf(clean, match.index), tag: match[1], kind: 'close' });
  }
  events.sort((left, right) => left.line - right.line);

  for (const event of events) {
    if (event.kind === 'open') {
      open.push({ tag: event.tag, line: event.line });
      continue;
    }
    const index = open.findLastIndex(({ tag }) => tag === event.tag);
    if (index < 0) continue;
    const entry = open[index];
    if (entry !== undefined) {
      regions.push({ tag: entry.tag, startLine: entry.line, endLine: event.line });
    }
    open.splice(index, 1);
  }

  return regions.sort((left, right) => left.startLine - right.startLine);
}

export function isInside(regions: Region[], tag: string, line: number): boolean {
  return regions.some((region) => (
    region.tag === tag && line >= region.startLine && line <= region.endLine
  ));
}

export interface TagUse {
  tag: string;
  line: number;
}

/** Every opening use of the named components, in document order. */
export function findTags(content: string, tags: readonly string[]): TagUse[] {
  const clean = withoutCodeBlocks(content);
  const wanted = new Set(tags);
  const uses: TagUse[] = [];
  for (const match of clean.matchAll(OPEN_TAG)) {
    if (match[1] === undefined || match.index === undefined) continue;
    if (wanted.has(match[1])) uses.push({ tag: match[1], line: lineOf(clean, match.index) });
  }
  return uses;
}

export interface IconUse {
  name: string;
  line: number;
}

/** Not a library name: a path, a URL, or inline SVG. */
function isLibraryName(name: string): boolean {
  return !/^[./]|^https?:|^</.test(name);
}

/**
 * Icons in JSX attributes and in frontmatter. Frontmatter icons drive the
 * sidebar and the card listings on area landing pages, so an unrecognised name
 * there goes missing exactly where the site is most visual.
 */
export function extractIcons(content: string): IconUse[] {
  const clean = withoutCodeBlocks(content);
  const icons: IconUse[] = [];

  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (frontmatter?.[1] !== undefined) {
    frontmatter[1].split('\n').forEach((line, index) => {
      const name = line.match(/^icon:\s*["']?([^"'\s]+)["']?\s*$/)?.[1];
      if (name !== undefined && isLibraryName(name)) icons.push({ name, line: index + 2 });
    });
  }

  for (const match of clean.matchAll(/\bicon=["']([^"']+)["']/g)) {
    const name = match[1];
    if (name === undefined || match.index === undefined) continue;
    if (isLibraryName(name)) icons.push({ name, line: lineOf(clean, match.index) });
  }
  return icons;
}

export function extractIconTypes(content: string): number[] {
  const clean = withoutCodeBlocks(content);
  return [...clean.matchAll(/\biconType=/g)]
    .filter((match) => match.index !== undefined)
    .map((match) => lineOf(clean, match.index as number));
}

export interface IframeUse {
  line: number;
}

export function extractIframes(content: string): IframeUse[] {
  const clean = withoutCodeBlocks(content);
  return [...clean.matchAll(/<iframe\b/gi)]
    .filter((match) => match.index !== undefined)
    .map((match) => ({ line: lineOf(clean, match.index as number) }));
}

/**
 * Callouts with nothing but blank lines between them. Two boxes in a row read
 * as one undifferentiated warning, so they merge or one becomes prose.
 */
export function adjacentCallouts(content: string): number[] {
  const regions = componentRegions(content).filter(({ tag }) => (
    (TYPED_CALLOUTS as readonly string[]).includes(tag) || tag === 'Callout'
  ));
  const lines = withoutCodeBlocks(content).split('\n');
  const adjacent: number[] = [];

  for (let index = 1; index < regions.length; index += 1) {
    const previous = regions[index - 1];
    const current = regions[index];
    if (previous === undefined || current === undefined) continue;
    const between = lines.slice(previous.endLine, current.startLine - 1);
    if (between.every((line) => line.trim() === '')) adjacent.push(current.startLine);
  }
  return adjacent;
}

/** Headings inside a callout — a callout that needs a heading is a section. */
export function headingsInCallouts(content: string): number[] {
  const regions = componentRegions(content).filter(({ tag }) => (
    (TYPED_CALLOUTS as readonly string[]).includes(tag) || tag === 'Callout'
  ));
  const lines = withoutCodeBlocks(content).split('\n');
  const found: number[] = [];

  lines.forEach((line, index) => {
    if (!/^\s{0,3}#{1,6}\s/.test(line)) return;
    const lineNumber = index + 1;
    if (regions.some((region) => lineNumber > region.startLine && lineNumber < region.endLine)) {
      found.push(lineNumber);
    }
  });
  return found;
}

export interface MaturityMark {
  level: MaturityLevel;
  line: number;
  /** True when the mark sits in the scope-gate position, before the first section. */
  pageLevel: boolean;
}

/**
 * A maturity mark states the level of a *Lightdash* feature, which is why it is
 * only recognised alongside a link to the maturity-levels page. A third party's
 * beta or preview status is prose about that vendor, not a Lightdash lifecycle.
 */
export function maturityMarks(content: string): MaturityMark[] {
  const clean = withoutCodeBlocks(content);
  const marks: MaturityMark[] = [];

  const lines = clean.split('\n');
  const firstHeading = lines.findIndex((line) => /^\s{0,3}#{1,6}\s/.test(line)) + 1;

  for (const match of clean.matchAll(/\[?\b(Experimental|Beta|Deprecated)\b\]?(\([^)]*\))?/g)) {
    const level = match[1] as MaturityLevel | undefined;
    if (level === undefined || match.index === undefined) continue;
    const line = lineOf(clean, match.index);
    const context = lines.slice(Math.max(0, line - 4), line + 3).join('\n');
    if (!context.includes(MATURITY_PAGE)) continue;
    marks.push({ level, line, pageLevel: firstHeading === 0 || line < firstHeading });
  }

  const seen = new Set<string>();
  return marks.filter((mark) => {
    const key = `${mark.level}:${mark.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Bold-text lifecycle markers, which carry no styling and cannot be scanned for. */
export function textLifecycleMarkers(content: string): { text: string; line: number }[] {
  const clean = withoutCodeBlocks(content);
  // "Preview" is deliberately absent: it names a product feature (preview
  // projects) and a UI control, never a maturity level this product defines.
  const pattern = /\*\*(Public |Private )?(Beta|Alpha|Experimental|Deprecated|Generally Available)\b[^*]{0,40}\*\*/g;
  return [...clean.matchAll(pattern)]
    .filter((match) => match.index !== undefined)
    .map((match) => ({ text: match[0], line: lineOf(clean, match.index as number) }));
}

export function snippetImports(content: string): string[] {
  return [...content.matchAll(/^import\s+\w+\s+from\s+['"]([^'"]+)['"]/gm)]
    .map((match) => match[1])
    .filter((path): path is string => path !== undefined)
    .map((path) => path.replace(/^\//, ''));
}

export interface TabsBlock {
  startLine: number;
  labels: string[];
  codeOnly: boolean;
}

/**
 * Code group labels, which live in each fence's meta string. Once code-only
 * alternatives moved out of `<Tabs>`, this became where nearly every sync label
 * on the site is written.
 */
export function codeGroupLabels(content: string): { startLine: number; labels: string[] }[] {
  const groups: { startLine: number; labels: string[] }[] = [];
  for (const match of content.matchAll(/<CodeGroup[^>]*>([\s\S]*?)<\/CodeGroup>/g)) {
    const body = match[1];
    if (body === undefined || match.index === undefined) continue;
    const labels = [...body.matchAll(/^```[a-z]*[ \t]+([^\n]+)$/gm)]
      .map((fence) => fence[1]?.trim())
      .filter((label): label is string => label !== undefined && label !== '');
    if (labels.length > 0) groups.push({ startLine: lineOf(content, match.index), labels });
  }
  return groups;
}

/**
 * Tabs whose panels hold nothing but a fenced code block. Those alternatives are
 * a code group: lighter control, same cross-page label syncing.
 */
export function tabsBlocks(content: string): TabsBlock[] {
  const blocks: TabsBlock[] = [];

  for (const match of content.matchAll(/<Tabs\b[^>]*>([\s\S]*?)<\/Tabs>/g)) {
    const body = match[1];
    if (body === undefined || match.index === undefined) continue;
    const panels = [...body.matchAll(/<Tab\s+([^>]*)>([\s\S]*?)<\/Tab>/g)];
    if (panels.length === 0) continue;

    const labels = panels
      .map((panel) => panel[1]?.match(/title=["']([^"']+)["']/)?.[1])
      .filter((label): label is string => label !== undefined);

    const codeOnly = panels.every((panel) => {
      const inner = (panel[2] ?? '').trim();
      const fences = inner.match(/```/g)?.length ?? 0;
      return fences === 2 && inner.startsWith('```') && inner.endsWith('```');
    });

    blocks.push({ startLine: lineOf(content, match.index), labels, codeOnly });
  }
  return blocks;
}

/**
 * A label one edit away from a canonical one — close enough that an author meant
 * it, different enough that Mintlify will not sync it.
 */
export function labelDrift(label: string): string | undefined {
  for (const labels of Object.values(CANONICAL_LABELS)) {
    if (labels.includes(label)) return undefined;
    for (const canonical of labels) {
      // Drift is a truncation of a canonical label. A label that *extends* one
      // ("Docker Compose" against "Docker") is a different alternative, not a typo.
      if (label.length >= 6 && canonical.startsWith(`${label} `)) return canonical;
    }
  }
  return undefined;
}

/** Sibling accordions that should read as one set inside an AccordionGroup. */
export function ungroupedAccordions(content: string): number[] {
  const regions = componentRegions(content);
  const accordions = regions.filter(({ tag }) => tag === 'Accordion');
  const groups = regions.filter(({ tag }) => tag === 'AccordionGroup');
  const lines = withoutCodeBlocks(content).split('\n');
  const loose = accordions.filter(({ startLine, endLine }) => !groups.some((group) => (
    startLine >= group.startLine && endLine <= group.endLine
  )));

  const flagged: number[] = [];
  for (let index = 1; index < loose.length; index += 1) {
    const previous = loose[index - 1];
    const current = loose[index];
    if (previous === undefined || current === undefined) continue;
    const between = lines.slice(previous.endLine, current.startLine - 1);
    if (between.every((line) => line.trim() === '')) flagged.push(previous.startLine);
  }
  return [...new Set(flagged)];
}

/** Widest content column a page can render before the table scrolls sideways. */
export const MAX_TABLE_COLUMNS = 4;

/** Longest a cell can be and still read as a glyph or short label rather than prose. */
const GLYPH_CELL_LIMIT = 24;

export const STICKY_WRAPPER = 'sticky-first-col';

export interface TableBlock {
  startLine: number;
  columns: number;
  /** Longest cell outside the first column, with component markup stripped. */
  widestValueCell: number;
  /** Cells outside the first column are glyphs or short labels, not prose. */
  isMatrix: boolean;
  pinned: boolean;
}

const ROW = /^\s*\|(.+)\|\s*$/;
const DIVIDER = /^\s*\|[\s:|-]+\|\s*$/;

function cellText(cell: string): string {
  return cell
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*`_]/g, '')
    .trim();
}

/** Markdown tables, measured so a too-wide one can be caught before it ships. */
export function markdownTables(content: string): TableBlock[] {
  const clean = withoutCodeBlocks(content);
  const lines = clean.split('\n');
  const tables: TableBlock[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const header = lines[index];
    const divider = lines[index + 1];
    if (header === undefined || divider === undefined) continue;
    if (!ROW.test(header) || !DIVIDER.test(divider)) continue;

    const columns = header.trim().replace(/^\||\|$/g, '').split('|').length;
    let widest = 0;
    let row = index + 2;
    for (; row < lines.length; row += 1) {
      const line = lines[row];
      if (line === undefined || !ROW.test(line)) break;
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').slice(1);
      for (const cell of cells) widest = Math.max(widest, cellText(cell).length);
    }

    const pinned = lines
      .slice(Math.max(0, index - 4), index)
      .some((line) => line.includes(STICKY_WRAPPER));

    tables.push({
      startLine: index + 1,
      columns,
      widestValueCell: widest,
      isMatrix: widest <= GLYPH_CELL_LIMIT,
      pinned,
    });
    index = row - 1;
  }
  return tables;
}

/**
 * Component rules that block a pull request. A rule earns promotion once the
 * corpus is clean of it, so enforcement never blocks a change on debt the
 * change did not create. Everything else is held to the baseline ratchet.
 */
export const BLOCKING_RULES = new Set([
  'accordion.ungrouped',
  'callout.adjacent',
  'callout.heading-inside',
  'frontmatter.description-length',
  'icon.font-awesome-prop',
  'icon.unknown',
  'icon.unsanctioned-group',
  'icon.unsanctioned-page',
  'lifecycle.missing-tag',
  'lifecycle.badge-taxonomy',
  'lifecycle.restated-status',
  'lifecycle.text-marker',
  'lifecycle.unbadged-status',
  'lifecycle.unexplained-tag',
  'media.missing-alt',
  'media.relative-path',
  'media.unframed-iframe',
  'media.unframed-image',
  'table.too-many-columns',
  'table.unpinned',
  'tabs.code-only',
  'tabs.label-drift',
]);

/**
 * Longest a frontmatter description can run. It is both the search snippet and
 * the subtitle on every card that lists the page, and the card is the tighter
 * constraint — past this it wraps into a block that crowds its neighbours.
 */
export const MAX_DESCRIPTION = 100;

export interface DescriptionProblem {
  length: number;
  sentences: number;
}

/** A description too long, or padded into more than one sentence, for a card. */
export function describeProblem(description: string): DescriptionProblem | undefined {
  const text = description.trim().replace(/^["']|["']$/g, '');
  const sentences = text.split(/[.!?]\s+(?=[A-Z(])/).filter(Boolean).length;
  if (text.length <= MAX_DESCRIPTION && sentences <= 1) return undefined;
  return { length: text.length, sentences };
}

/**
 * Callouts that name a status without wearing it as a badge. A linked or bolded
 * level reads as ordinary prose, so it carries none of the consistency a reader
 * learns to scan for.
 */
export function unbadgedStatuses(content: string): number[] {
  const clean = withoutCodeBlocks(content);
  const lines = clean.split('\n');
  const found: number[] = [];

  for (const region of componentRegions(clean)) {
    if (!(TYPED_CALLOUTS as readonly string[]).includes(region.tag)) continue;
    const body = lines.slice(region.startLine - 1, region.endLine).join('\n');
    if (!body.includes(MATURITY_PAGE)) continue;
    if (/<Badge\b/.test(body)) continue;
    found.push(region.startLine);
  }
  return found;
}

/**
 * A badge whose sentence names the same status again. The badge already said
 * it, so the restatement is filler — and a callout that only restates its badge
 * duplicates the sidebar pill the frontmatter tag already renders.
 */
export function restatedStatuses(content: string): number[] {
  const clean = withoutCodeBlocks(content);
  const found: number[] = [];

  for (const match of clean.matchAll(/<Badge[^>]*>(\w+)<\/Badge>([^\n]*)/g)) {
    const level = match[1];
    const rest = match[2];
    if (level === undefined || rest === undefined || match.index === undefined) continue;
    if (!(MATURITY_LEVELS as readonly string[]).includes(level)) continue;
    // Link text explains the level and may name it; only the sentence counts.
    const prose = rest.replace(/\[[^\]]*\]\([^)]*\)/g, '');
    if (new RegExp(`\\b${level}\\b`, 'i').test(prose)) found.push(lineOf(clean, match.index));
  }
  return found;
}

/** The one badge each status wears, so the set stays learnable. */
export const BADGE_TAXONOMY: Record<string, { color: string; icon: string }> = {
  Experimental: { color: 'orange', icon: 'test-pipe-2' },
  Beta: { color: 'purple', icon: 'flask' },
  Deprecated: { color: 'gray', icon: 'haze-moon' },
  Enterprise: { color: 'blue', icon: 'building-plus' },
  'Self-hosted': { color: 'blue', icon: 'server' },
  Cloud: { color: 'blue', icon: 'cloud-bolt' },
};

const BADGE = /<Badge\b([^>]*)>([^<]*)<\/Badge>/g;

export interface BadgeProblem {
  line: number;
  label: string;
  detail: string;
}

/** Badges that drift from the taxonomy, and badges dressed up as links. */
export function badgeProblems(content: string): BadgeProblem[] {
  const clean = withoutCodeBlocks(content);
  const problems: BadgeProblem[] = [];

  for (const match of clean.matchAll(BADGE)) {
    const attrs = match[1] ?? '';
    const label = (match[2] ?? '').trim();
    if (match.index === undefined) continue;
    const line = lineOf(clean, match.index);
    const around = clean.slice(Math.max(0, match.index - 2), match.index + match[0].length + 2);

    if (/\[|\]\(/.test(match[2] ?? '') || /\[\s*$/.test(clean.slice(0, match.index).slice(-2))
      || /^\s*\]\(/.test(clean.slice(match.index + match[0].length))) {
      problems.push({ line, label, detail: 'a badge is a label, not a link' });
      continue;
    }
    if (around.includes('](') && around.trimStart().startsWith('[')) {
      problems.push({ line, label, detail: 'a badge is a label, not a link' });
      continue;
    }

    const expected = BADGE_TAXONOMY[label];
    if (expected === undefined) continue;
    const color = /color="([^"]+)"/.exec(attrs)?.[1];
    const icon = /icon="([^"]+)"/.exec(attrs)?.[1];
    const size = /size="([^"]+)"/.exec(attrs)?.[1];
    const wrong: string[] = [];
    if (color !== expected.color) wrong.push(`color="${expected.color}"`);
    if (icon !== expected.icon) wrong.push(`icon="${expected.icon}"`);
    if (size !== 'sm') wrong.push('size="sm"');
    if (wrong.length > 0) problems.push({ line, label, detail: `wants ${wrong.join(' ')}` });
  }
  return problems;
}
