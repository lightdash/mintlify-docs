#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { argument, errorMessage, isDirectRun, writeJsonReport } from './lib/command.ts';
import {
  adjacentCallouts,
  badgeProblems,
  allowsPageIcon,
  BLOCKING_RULES,
  extractIconTypes,
  extractIcons,
  extractIframes,
  headingsInCallouts,
  isInside,
  TABLER_ICONS,
  labelDrift,
  MATURITY_PAGE,
  codeGroupLabels,
  describeProblem,
  MAX_DESCRIPTION,
  markdownTables,
  maturityMarks,
  MAX_TABLE_COLUMNS,
  componentRegions,
  snippetImports,
  tabsBlocks,
  textLifecycleMarkers,
  restatedStatuses,
  unbadgedStatuses,
  ungroupedAccordions,
} from './lib/components.ts';
import { findPages, normalizePath, readMintignore } from './lib/discovery.ts';
import { docsJsonLine, groupIcons } from './lib/navigation.ts';
import { buildWorkflowAnnotations, createFinding } from './lib/findings.ts';
import { parseFrontmatter } from './lib/frontmatter.ts';
import { extractImages } from './lib/images.ts';
import type { Finding } from './lib/types.ts';

export interface ComponentAuditReport {
  schemaVersion: 1;
  status: 'passed' | 'advisory';
  scope: 'all';
  summary: {
    warnings: number;
    byRule: Record<string, number>;
    byArea: Record<string, number>;
  };
  findings: Finding[];
}

export function advisoryWorkflowFindings(
  findings: Finding[],
  changed?: ReadonlySet<string>,
): Finding[] {
  return findings.filter((finding) => (
    !BLOCKING_RULES.has(finding.rule)
      && (changed === undefined || changed.has(finding.file))
  ));
}

const SNIPPET_DIRECTORY = 'snippets';

function area(file: string): string {
  const [head] = normalizePath(file).split('/');
  return head?.endsWith('.mdx') === true || head?.endsWith('.md') === true ? 'root' : (head ?? 'root');
}

function readSnippets(root: string): Map<string, string> {
  const directory = path.join(root, SNIPPET_DIRECTORY);
  const snippets = new Map<string, string>();
  if (!fs.existsSync(directory)) return snippets;

  function walk(current: string): void {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) walk(absolute);
      if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
        snippets.set(normalizePath(path.relative(root, absolute)), fs.readFileSync(absolute, 'utf8'));
      }
    }
  }
  walk(directory);
  return snippets;
}

export const BASELINE_FILE = 'scripts/docs/component-baseline.json';

export interface Baseline {
  /** Findings per rule that the corpus is known to carry. */
  rules: Record<string, number>;
}

export interface Regression {
  rule: string;
  baseline: number;
  current: number;
}

export function readBaseline(root: string, file = BASELINE_FILE): Baseline {
  const path_ = path.join(root, file);
  if (!fs.existsSync(path_)) return { rules: {} };
  return JSON.parse(fs.readFileSync(path_, 'utf8')) as Baseline;
}

export function writeBaseline(root: string, byRule: Record<string, number>, file = BASELINE_FILE): void {
  const sorted = Object.fromEntries(Object.entries(byRule).sort(([a], [b]) => a.localeCompare(b)));
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify({ rules: sorted }, null, 2)}\n`);
}

/**
 * Rules carrying more findings than the baseline records. Counts only ever
 * ratchet down: a change may leave existing debt alone, never add to it.
 */
export function regressions(baseline: Baseline, byRule: Record<string, number>): Regression[] {
  const rules = new Set([...Object.keys(baseline.rules), ...Object.keys(byRule)]);
  return [...rules]
    .map((rule) => ({ rule, baseline: baseline.rules[rule] ?? 0, current: byRule[rule] ?? 0 }))
    .filter(({ baseline: was, current }) => current > was)
    .sort((left, right) => left.rule.localeCompare(right.rule));
}

export interface AuditComponentsOptions {
  root?: string;
}

export function auditComponents({ root = process.cwd() }: AuditComponentsOptions = {}): ComponentAuditReport {
  const snippets = readSnippets(root);
  const pages = [...findPages(root, readMintignore(root)), ...snippets.keys()].sort();
  const findings: Finding[] = [];

  for (const file of pages) {
    if (file.startsWith(`${MATURITY_PAGE}`)) continue;
    const content = snippets.get(file) ?? fs.readFileSync(path.join(root, file), 'utf8');
    const regions = componentRegions(content);
    const { fields } = parseFrontmatter(content);

    for (const { line } of extractIframes(content)) {
      if (isInside(regions, 'Frame', line)) continue;
      findings.push(createFinding(
        'media.unframed-iframe',
        file,
        line,
        'Wrap the iframe in <Frame> so it stays inside the column.',
        { severity: 'warning' },
      ));
    }

    for (const image of extractImages(content)) {
      if (!isInside(regions, 'Frame', image.line)) {
        findings.push(createFinding(
          'media.unframed-image',
          file,
          image.line,
          `Wrap the image in <Frame>: ${image.url}`,
          { severity: 'warning', target: image.url },
        ));
      }
      if (/^\.{1,2}\//.test(image.url)) {
        findings.push(createFinding(
          'media.relative-path',
          file,
          image.line,
          `Image path must be root-relative (/images/…): ${image.url}`,
          { severity: 'warning', autoFixable: true, target: image.url },
        ));
      }
      if (image.alt === undefined || image.alt.trim() === '') {
        findings.push(createFinding(
          'media.missing-alt',
          file,
          image.line,
          `Image needs alt text describing what it shows: ${image.url}`,
          { severity: 'warning', target: image.url },
        ));
      }
    }

    const description = fields.get('description');
    if (description !== undefined && !file.startsWith(`${SNIPPET_DIRECTORY}/`)) {
      const problem = describeProblem(description);
      if (problem !== undefined) {
        findings.push(createFinding(
          'frontmatter.description-length',
          file,
          1,
          problem.sentences > 1
            ? `Description runs to ${problem.sentences} sentences; a card subtitle is one.`
            : `Description is ${problem.length} characters; cards crowd past ${MAX_DESCRIPTION}.`,
          { severity: 'warning', target: String(problem.length) },
        ));
      }
    }

    const pageIcon = fields.get('icon');
    if (pageIcon !== undefined && !allowsPageIcon(file) && !file.startsWith(`${SNIPPET_DIRECTORY}/`)) {
      findings.push(createFinding(
        'icon.unsanctioned-page',
        file,
        1,
        'Only top-level areas carry icons, plus the documented carve-outs. Drop this one.',
        { severity: 'warning', autoFixable: true, target: pageIcon },
      ));
    }

    for (const { name, line } of extractIcons(content)) {
      if (TABLER_ICONS.has(name)) continue;
      findings.push(createFinding(
        'icon.unknown',
        file,
        line,
        `Not a Tabler icon name, so it renders nothing: ${name}`,
        { severity: 'warning', target: name },
      ));
    }
    for (const line of extractIconTypes(content)) {
      findings.push(createFinding(
        'icon.font-awesome-prop',
        file,
        line,
        'iconType is Font Awesome-only and inert under the Tabler library.',
        { severity: 'warning', autoFixable: true },
      ));
    }

    for (const line of adjacentCallouts(content)) {
      findings.push(createFinding(
        'callout.adjacent',
        file,
        line,
        'Two callouts in a row — merge them or demote one to prose.',
        { severity: 'warning' },
      ));
    }
    for (const line of headingsInCallouts(content)) {
      findings.push(createFinding(
        'callout.heading-inside',
        file,
        line,
        'A callout that needs a heading is a section.',
        { severity: 'warning' },
      ));
    }

    for (const line of unbadgedStatuses(content)) {
      findings.push(createFinding(
        'lifecycle.unbadged-status',
        file,
        line,
        'State the status with a <Badge>, not as bold or linked text.',
        { severity: 'warning' },
      ));
    }

    for (const { line, label, detail } of badgeProblems(content)) {
      findings.push(createFinding(
        'lifecycle.badge-taxonomy',
        file,
        line,
        `Badge "${label}" ${detail}.`,
        { severity: 'warning', target: label },
      ));
    }

    for (const line of restatedStatuses(content)) {
      findings.push(createFinding(
        'lifecycle.restated-status',
        file,
        line,
        'The badge already states the level — say what it means for the reader instead.',
        { severity: 'warning' },
      ));
    }

    for (const marker of textLifecycleMarkers(content)) {
      findings.push(createFinding(
        'lifecycle.text-marker',
        file,
        marker.line,
        `Lifecycle is a <Badge>, not bold text: ${marker.text}`,
        { severity: 'warning', target: marker.text },
      ));
    }

    const inherited = snippetImports(content).flatMap((snippet) => (
      maturityMarks(snippets.get(snippet) ?? '')
    ));
    // A mark below the first heading describes one section, not the page.
    const marks = [...maturityMarks(content), ...inherited].filter(({ pageLevel }) => pageLevel);
    const tag = fields.get('tag');

    if (marks.length > 0 && !file.startsWith(`${SNIPPET_DIRECTORY}/`)) {
      const levels = [...new Set(marks.map(({ level }) => level))];
      const line = marks[0]?.line ?? 1;
      if (tag === undefined) {
        findings.push(createFinding(
          'lifecycle.missing-tag',
          file,
          line,
          `Non-GA page needs tag: "${levels[0]}" in frontmatter for the sidebar pill.`,
          { severity: 'warning', target: levels[0] },
        ));
      } else if (!levels.includes(tag as never)) {
        findings.push(createFinding(
          'lifecycle.tag-mismatch',
          file,
          line,
          `Frontmatter tag "${tag}" does not match the level on the page (${levels.join(', ')}).`,
          { severity: 'warning', target: tag },
        ));
      }
    }

    if (tag !== undefined && marks.length === 0) {
      findings.push(createFinding(
        'lifecycle.unexplained-tag',
        file,
        1,
        `Tagged "${tag}" but the page never links what that means — add the scope-gate <Info> citing /${MATURITY_PAGE}.`,
        { severity: 'warning', target: tag },
      ));
    }

    for (const block of tabsBlocks(content)) {
      if (block.codeOnly) {
        findings.push(createFinding(
          'tabs.code-only',
          file,
          block.startLine,
          'Every panel is a single code block — this is a <CodeGroup>.',
          { severity: 'warning' },
        ));
      }
      for (const label of block.labels) {
        const canonical = labelDrift(label);
        if (canonical === undefined) continue;
        findings.push(createFinding(
          'tabs.label-drift',
          file,
          block.startLine,
          `Label "${label}" will not sync with "${canonical}" — match it exactly.`,
          { severity: 'warning', target: label },
        ));
      }
    }

    // A glyph matrix stays readable past four columns, and a Reference page is
    // allowed the width its lookup needs. Both earn the columns; both must pin.
    const comprehensive = fields.get('doc-type') === 'reference';
    for (const table of markdownTables(content)) {
      if (table.columns <= MAX_TABLE_COLUMNS) continue;
      if (!table.isMatrix && !comprehensive) {
        findings.push(createFinding(
          'table.too-many-columns',
          file,
          table.startLine,
          `${table.columns} columns of prose will scroll sideways on a laptop — cut to ${MAX_TABLE_COLUMNS}.`,
          { severity: 'warning' },
        ));
        continue;
      }
      if (table.pinned) continue;
      findings.push(createFinding(
        'table.unpinned',
        file,
        table.startLine,
        `A ${table.columns}-column table needs the sticky-first-col wrapper so row labels survive scrolling.`,
        { severity: 'warning' },
      ));
    }

    for (const group of codeGroupLabels(content)) {
      for (const label of group.labels) {
        const canonical = labelDrift(label);
        if (canonical === undefined) continue;
        findings.push(createFinding(
          'tabs.label-drift',
          file,
          group.startLine,
          `Label "${label}" will not sync with "${canonical}" — match it exactly.`,
          { severity: 'warning', target: label },
        ));
      }
    }

    for (const line of ungroupedAccordions(content)) {
      findings.push(createFinding(
        'accordion.ungrouped',
        file,
        line,
        'Sibling accordions belong in an <AccordionGroup>.',
        { severity: 'warning' },
      ));
    }
  }

  const docsPath = path.join(root, 'docs.json');
  if (fs.existsSync(docsPath)) {
    const docsContent = fs.readFileSync(docsPath, 'utf8');
    const docs = JSON.parse(docsContent) as Record<string, unknown>;
    for (const { group, icon, depth } of groupIcons(docs)) {
      if (depth === 0) {
        if (!TABLER_ICONS.has(icon)) {
          findings.push(createFinding(
            'icon.unknown',
            'docs.json',
            docsJsonLine(docsContent, icon),
            `Not a Tabler icon name, so it renders nothing: ${icon}`,
            { severity: 'warning', target: icon },
          ));
        }
        continue;
      }
      findings.push(createFinding(
        'icon.unsanctioned-group',
        'docs.json',
        docsJsonLine(docsContent, icon),
        `Only top-level areas carry icons — drop the icon on "${group}".`,
        { severity: 'warning', autoFixable: true, target: group },
      ));
    }
  }

  findings.sort((left, right) => (
    left.file.localeCompare(right.file) || left.line - right.line || left.rule.localeCompare(right.rule)
  ));

  const byRule: Record<string, number> = {};
  const byArea: Record<string, number> = {};
  for (const finding of findings) {
    byRule[finding.rule] = (byRule[finding.rule] ?? 0) + 1;
    byArea[area(finding.file)] = (byArea[area(finding.file)] ?? 0) + 1;
  }

  return {
    schemaVersion: 1,
    status: findings.length === 0 ? 'passed' : 'advisory',
    scope: 'all',
    summary: { warnings: findings.length, byRule, byArea },
    findings,
  };
}

function table(counts: Record<string, number>): string[] {
  const width = Math.max(0, ...Object.keys(counts).map((key) => key.length));
  return Object.entries(counts)
    .sort(([, left], [, right]) => right - left)
    .map(([key, count]) => `  ${key.padEnd(width)}  ${String(count).padStart(5)}`);
}

export async function main(): Promise<void> {
  const output = argument('--output');
  const rule = argument('--rule');
  const updateBaseline = process.argv.includes('--update-baseline');
  const checkBaseline = process.argv.includes('--baseline');
  const changedFileList = argument('--changed-files');
  const root = process.cwd();
  try {
    const report = auditComponents({ root });
    writeJsonReport(output, report);

    if (updateBaseline) {
      writeBaseline(root, report.summary.byRule);
      console.log(`Baseline written: ${report.summary.warnings} finding(s) across ${Object.keys(report.summary.byRule).length} rule(s).`);
      return;
    }

    console.log(`${report.status.toUpperCase()}: ${report.summary.warnings} component finding(s)`);
    if (rule !== undefined) {
      for (const item of report.findings.filter((finding) => finding.rule === rule)) {
        console.log(`${item.file}:${item.line} [${item.rule}] ${item.message}`);
      }
    } else {
      console.log('\nBy rule');
      for (const row of table(report.summary.byRule)) console.log(row);
      console.log('\nBy area');
      for (const row of table(report.summary.byArea)) console.log(row);
    }

    // Annotate the lines a reviewer can actually act on. GitHub renders these
    // inline on the diff, so scoping to the change keeps them from drowning the
    // review in debt the change never touched.
    if (process.env.GITHUB_ACTIONS === 'true') {
      const changed = changedFileList === undefined
        ? undefined
        : new Set(fs.readFileSync(changedFileList, 'utf8').split('\n').map((line) => line.trim()).filter(Boolean));
      const scoped = advisoryWorkflowFindings(report.findings, changed);
      const annotations = buildWorkflowAnnotations(scoped, 30);
      for (const command of annotations.commands) console.log(command);
      if (annotations.omitted > 0) {
        console.log(`${annotations.omitted} component finding(s) omitted from annotations; see the JSON artifact.`);
      }
    }

    if (checkBaseline) {
      const grown = regressions(readBaseline(root), report.summary.byRule);
      console.log('');
      if (grown.length === 0) {
        console.log('Baseline holds: no rule gained findings.');
      } else {
        for (const { rule: name, baseline, current } of grown) {
          console.log(`REGRESSION ${name}: ${baseline} -> ${current}`);
        }
        console.log('\nFix them, or run `npm run audit:components -- --update-baseline` if the rise is intended.');
        process.exitCode = 1;
      }
    }
  } catch (error) {
    const report = {
      schemaVersion: 1,
      status: 'tool_failure',
      scope: 'all',
      summary: { warnings: 0, byRule: {}, byArea: {} },
      findings: [],
      error: errorMessage(error),
    } as const;
    writeJsonReport(output, report);
    console.error(report.error);
    process.exitCode = 2;
  }
}

if (isDirectRun(import.meta.url)) await main();
