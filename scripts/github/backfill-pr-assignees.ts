#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

import { isDirectRun } from '../docs/lib/command.ts';
import {
  isBot,
  normalizeHandle,
  resolveCcHandle,
  resolvePullRequestReference,
} from './lib/pr-assignment.ts';

interface PullRequest {
  number: number;
  title: string;
  body: string | null;
  assignees: Array<{ login: string }>;
  author: { login: string; is_bot?: boolean; isBot?: boolean } | null;
}

interface TimelineEvent {
  event?: string;
  source?: {
    issue?: {
      number?: number;
      pull_request?: unknown;
      repository?: { full_name?: string };
    };
  };
}

function gh(args: string[]): string {
  return execFileSync('gh', args, { encoding: 'utf8' });
}

function ghJson<T>(args: string[]): T {
  return JSON.parse(gh(args)) as T;
}

function sourceAuthor(sourceRepo: string, sourceNumber: number): string | undefined {
  const response = ghJson<{ user?: { login?: string } }>([
    'api',
    `repos/${sourceRepo}/pulls/${sourceNumber}`,
  ]);
  return response.user?.login;
}

function timelineSource(docsRepo: string, sourceRepo: string, prNumber: number): number | undefined {
  const pages = ghJson<TimelineEvent[][]>([
    'api',
    `repos/${docsRepo}/issues/${prNumber}/timeline`,
    '--paginate',
    '--slurp',
  ]);
  return pages.flat().findLast((event) => (
    event.event === 'cross-referenced'
    && event.source?.issue?.repository?.full_name === sourceRepo
    && event.source.issue.pull_request !== undefined
  ))?.source?.issue?.number;
}

function assignOrComment(docsRepo: string, prNumber: number, author: string): boolean {
  try {
    const issue = ghJson<{ assignees?: Array<{ login: string }> }>([
      'api',
      '--method',
      'POST',
      `repos/${docsRepo}/issues/${prNumber}/assignees`,
      '-f',
      `assignees[]=${author}`,
    ]);
    if (issue.assignees?.some(({ login }) => login === author) === true) return true;
  } catch {
    console.error(`WARN PR #${prNumber}: assignment to @${author} failed, trying fallback cc comment`);
  }

  const fallback = `cc @${author}`;
  const pages = ghJson<Array<Array<{ body?: string }>>>([
    'api',
    `repos/${docsRepo}/issues/${prNumber}/comments`,
    '--paginate',
    '--slurp',
  ]);
  if (pages.flat().some(({ body }) => body?.trim() === fallback)) return false;

  try {
    gh(['pr', 'comment', String(prNumber), '-R', docsRepo, '--body', fallback]);
  } catch {
    console.error(`WARN PR #${prNumber}: fallback cc comment for @${author} failed`);
  }
  return false;
}

function applyAssignment(
  pr: PullRequest,
  author: string,
  reason: string,
  source: string | undefined,
  docsRepo: string,
  dryRun: boolean,
): void {
  const normalized = normalizeHandle(author);
  if (isBot(normalized)) {
    console.log(`SKIP PR #${pr.number}: ${reason} is bot @${normalized}: ${pr.title}`);
    return;
  }
  const origin = source === undefined ? `via ${reason}` : `from ${source} via ${reason}`;
  if (dryRun) {
    console.log(`DRY RUN PR #${pr.number}: would assign @${normalized} ${origin}: ${pr.title}`);
    return;
  }
  if (assignOrComment(docsRepo, pr.number, normalized)) {
    console.log(`ASSIGNED PR #${pr.number} to @${normalized} ${origin}: ${pr.title}`);
  } else {
    console.log(`FALLBACK PR #${pr.number}: assignment to @${normalized} did not stick: ${pr.title}`);
  }
}

export function main(): void {
  const dryRun = process.env.DRY_RUN !== '0';
  const docsRepo = process.env.DOCS_REPO ?? 'lightdash/mintlify-docs';
  const sourceRepo = process.env.SOURCE_REPO ?? 'lightdash/lightdash';
  const pullRequests = ghJson<PullRequest[]>([
    'pr',
    'list',
    '-R',
    docsRepo,
    '--state',
    'open',
    '--limit',
    '200',
    '--json',
    'number,title,body,assignees,url,author',
  ]);

  console.log(`Found ${pullRequests.length} open PRs in ${docsRepo}`);
  console.log(`Scanning open unassigned PRs only with DRY_RUN=${dryRun ? '1' : '0'}`);

  for (const pr of pullRequests.filter(({ assignees }) => assignees.length === 0)) {
    const body = pr.body ?? '';
    const reference = resolvePullRequestReference(body);
    const sourceNumber = reference?.number ?? timelineSource(docsRepo, sourceRepo, pr.number);
    if (sourceNumber !== undefined) {
      const author = sourceAuthor(sourceRepo, sourceNumber);
      if (author === undefined) {
        console.log(`SKIP PR #${pr.number}: ${sourceRepo}#${sourceNumber} has no author: ${pr.title}`);
        continue;
      }
      applyAssignment(
        pr,
        author,
        reference?.reason ?? 'timeline cross-reference',
        `${sourceRepo}#${sourceNumber}`,
        docsRepo,
        dryRun,
      );
      continue;
    }

    const ccAuthor = resolveCcHandle(body);
    if (ccAuthor !== undefined) {
      applyAssignment(pr, ccAuthor, 'cc mention', undefined, docsRepo, dryRun);
      continue;
    }

    if (pr.author?.login !== undefined && !(pr.author.is_bot ?? pr.author.isBot ?? false)) {
      applyAssignment(pr, pr.author.login, 'docs PR author', undefined, docsRepo, dryRun);
      continue;
    }
    console.log(`SKIP PR #${pr.number}: no source PR or cc mention found: ${pr.title}`);
  }
}

if (isDirectRun(import.meta.url)) main();
