#!/usr/bin/env node

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { argument, errorMessage, isDirectRun, writeJsonReport } from './lib/command.ts';
import { lineOf } from './lib/content.ts';
import { normalizePath } from './lib/discovery.ts';
import { buildWorkflowAnnotations, createFinding } from './lib/findings.ts';
import type { ValidationReport } from './lib/types.ts';

export interface AuditInternalLinksOptions {
  root?: string;
  runMint?: MintRunner;
}

interface MintResult {
  exitCode: number;
  output: string;
}

type MintRunner = (root: string) => Promise<MintResult>;

const runMint: MintRunner = (root) => new Promise((resolve, reject) => {
  const child = spawn('mint', ['broken-links', '--check-anchors'], {
    cwd: root,
    env: { ...process.env, CI: 'true', NO_COLOR: '1' },
  });
  let output = '';
  child.stdout.on('data', (chunk: Buffer) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk: Buffer) => { output += chunk.toString(); });
  child.on('error', reject);
  child.on('close', (exitCode) => resolve({ exitCode: exitCode ?? 2, output }));
});

function brokenLinksFrom(output: string): Array<{ file: string; target: string }> {
  const lines = output.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '').split('\n');
  const brokenLinks: Array<{ file: string; target: string }> = [];
  let file: string | undefined;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/\.(md|mdx)$/.test(trimmed)) {
      file = normalizePath(trimmed);
      continue;
    }
    const marker = trimmed.indexOf('⎿');
    if (file !== undefined && marker >= 0) {
      const target = trimmed.slice(marker + 1).trim();
      if (target !== '') brokenLinks.push({ file, target });
    }
  }
  return brokenLinks;
}

export async function auditInternalLinks({
  root = process.cwd(),
  runMint: checkLinks = runMint,
}: AuditInternalLinksOptions = {}): Promise<ValidationReport> {
  const result = await checkLinks(root);
  const brokenLinks = brokenLinksFrom(result.output);
  if (result.exitCode > 1 || (result.exitCode === 1 && brokenLinks.length === 0)) {
    throw new Error(`Mintlify link audit failed with exit code ${result.exitCode}.\n${result.output}`);
  }
  const searchOffsets = new Map<string, number>();
  const findings = brokenLinks.map((link) => {
    const file = link.file;
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    const searchKey = `${file}\0${link.target}`;
    const index = content.indexOf(link.target, searchOffsets.get(searchKey) ?? 0);
    if (index >= 0) searchOffsets.set(searchKey, index + link.target.length);
    return createFinding(
      link.target.includes('#') ? 'link.broken-anchor' : 'link.broken-internal',
      file,
      index < 0 ? 1 : lineOf(content, index),
      `Internal link does not resolve: ${link.target}`,
      { target: link.target },
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
