#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { argument, errorMessage, isDirectRun, writeJsonReport } from './lib/command.ts';
import { lineOf } from './lib/content.ts';
import { normalizePath } from './lib/discovery.ts';
import { buildWorkflowAnnotations, createFinding } from './lib/findings.ts';
import type { ValidationReport } from './lib/types.ts';

export interface AuditInternalLinksOptions {
  root?: string;
}

interface BrokenInternalLink {
  originalPath: string;
  relativeDir: string;
  filename: string;
  anchorLink?: string;
}

export async function auditInternalLinks({
  root = process.cwd(),
}: AuditInternalLinksOptions = {}): Promise<ValidationReport> {
  const moduleName: string = '@mintlify/link-rot';
  const { getBrokenInternalLinks } = await import(moduleName) as {
    getBrokenInternalLinks: (
      repoPath: string,
      options: { checkAnchors: boolean },
    ) => Promise<BrokenInternalLink[]>;
  };
  const brokenLinks = await getBrokenInternalLinks(root, { checkAnchors: true });
  const searchOffsets = new Map<string, number>();
  const findings = brokenLinks.map((link) => {
    const file = normalizePath(path.join(link.relativeDir, link.filename));
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    const searchKey = `${file}\0${link.originalPath}`;
    const index = content.indexOf(link.originalPath, searchOffsets.get(searchKey) ?? 0);
    if (index >= 0) searchOffsets.set(searchKey, index + link.originalPath.length);
    return createFinding(
      link.anchorLink === undefined ? 'link.broken-internal' : 'link.broken-anchor',
      file,
      index < 0 ? 1 : lineOf(content, index),
      `Internal link does not resolve: ${link.originalPath}`,
      { target: link.originalPath },
    );
  }).sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line);

  return {
    schemaVersion: 1,
    status: findings.length === 0 ? 'passed' : 'failed',
    scope: 'all',
    summary: { errors: findings.length, autoFixable: 0 },
    findings,
  };
}

export async function main(): Promise<void> {
  const output = argument('--output');

  try {
    const report = await auditInternalLinks();
    writeJsonReport(output, report);

    if (process.env.GITHUB_ACTIONS === 'true') {
      const annotations = buildWorkflowAnnotations(report.findings);
      for (const command of annotations.commands) console.log(command);
      if (annotations.omitted > 0) {
        console.log(`${annotations.omitted} finding(s) omitted from annotations; see the JSON artifact.`);
      }
    }

    console.log(`${report.status.toUpperCase()}: ${report.summary.errors} broken internal link(s)`);
    for (const item of report.findings) {
      console.log(`${item.file}:${item.line} [${item.rule}] ${item.message}`);
    }
    process.exitCode = report.status === 'passed' ? 0 : 1;
  } catch (error) {
    const report = {
      schemaVersion: 1,
      status: 'tool_failure',
      scope: 'all',
      summary: { errors: 0, autoFixable: 0 },
      findings: [],
      error: errorMessage(error),
    } as const;
    writeJsonReport(output, report);
    console.error(report.error);
    process.exitCode = 2;
  }
}

if (isDirectRun(import.meta.url)) await main();
