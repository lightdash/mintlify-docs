#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { argument, errorMessage, isDirectRun, writeJsonReport } from './lib/command.ts';
import { findPages, readMintignore } from './lib/discovery.ts';
import { createFinding } from './lib/findings.ts';
import { extractLinks, requestUrl } from './lib/links.ts';
import type { ExternalLinksReport, UrlCheckResult } from './lib/types.ts';

export interface AuditExternalLinksOptions {
  root?: string;
  checkUrl?: (url: string) => Promise<UrlCheckResult>;
}

export async function auditExternalLinks({
  root = process.cwd(),
  checkUrl = requestUrl,
}: AuditExternalLinksOptions = {}): Promise<ExternalLinksReport> {
  const pages = findPages(root, readMintignore(root));
  const references = pages.flatMap((file) => {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    return extractLinks(content)
      .filter(({ url }) => /^https?:\/\//.test(url))
      .map((link) => ({ file, ...link }));
  });
  const results = new Map<string, UrlCheckResult>();
  const urls = [...new Set(references.map(({ url }) => url))];

  for (let index = 0; index < urls.length; index += 10) {
    const batch = urls.slice(index, index + 10);
    const checks = await Promise.all(batch.map(async (url): Promise<[string, UrlCheckResult]> => {
      try {
        return [url, await checkUrl(url)];
      } catch (error) {
        return [url, { ok: false, status: 'error', error: errorMessage(error) }];
      }
    }));
    for (const [url, result] of checks) results.set(url, result);
  }

  const findings = references.flatMap(({ file, line, url }) => {
    const result = results.get(url);
    if (result === undefined || result.ok) return [];
    const detail = result.error ?? `HTTP ${result.status}`;
    return [createFinding(
      'external.unreachable',
      file,
      line,
      `External link is unavailable (${detail}): ${url}`,
      { severity: 'warning', target: url },
    )];
  });

  return {
    schemaVersion: 1,
    status: findings.length === 0 ? 'passed' : 'advisory',
    scope: 'all',
    summary: { warnings: findings.length },
    findings,
  };
}

export async function main(): Promise<void> {
  const output = argument('--output');
  try {
    const report = await auditExternalLinks();
    writeJsonReport(output, report);
    console.log(`${report.status.toUpperCase()}: ${report.summary.warnings} external link warning(s)`);
    for (const item of report.findings) {
      console.log(`${item.file}:${item.line} [${item.rule}] ${item.message}`);
    }
  } catch (error) {
    const report = {
      schemaVersion: 1,
      status: 'tool_failure',
      scope: 'all',
      summary: { warnings: 0 },
      findings: [],
      error: errorMessage(error),
    } as const;
    writeJsonReport(output, report);
    console.error(report.error);
    process.exitCode = 2;
  }
}

if (isDirectRun(import.meta.url)) await main();
