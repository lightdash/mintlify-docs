#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { errorMessage, isDirectRun } from './lib/command.ts';
import { findPages, readMintignore } from './lib/discovery.ts';
import { fixImagePaths, wrapBareMedia } from './lib/fixes.ts';

export interface FixComponentsOptions {
  root?: string;
  dryRun?: boolean;
}

export interface FixReport {
  paths: number;
  framed: number;
  files: number;
  skipped: { file: string; line: number; reason: string }[];
}

/**
 * The mechanical half of the component sweep: image paths that only resolve
 * while authoring, and media that escapes the column because nothing holds it.
 * Anything needing a judgment call is reported, never guessed at.
 */
export function fixComponents({ root = process.cwd(), dryRun = false }: FixComponentsOptions = {}): FixReport {
  const snippets = fs.existsSync(path.join(root, 'snippets'))
    ? fs.readdirSync(path.join(root, 'snippets'), { recursive: true, encoding: 'utf8' })
      .filter((entry) => /\.mdx?$/.test(entry))
      .map((entry) => `snippets/${entry.replaceAll('\\', '/')}`)
    : [];
  const pages = [...findPages(root, readMintignore(root)), ...snippets].sort();
  const report: FixReport = { paths: 0, framed: 0, files: 0, skipped: [] };

  for (const file of pages) {
    const absolute = path.join(root, file);
    const original = fs.readFileSync(absolute, 'utf8');

    const paths = fixImagePaths(file, original);
    const media = wrapBareMedia(paths.content);

    report.paths += paths.applied;
    report.framed += media.applied;
    for (const skip of media.skipped) report.skipped.push({ file, ...skip });

    if (media.content !== original) {
      report.files += 1;
      if (!dryRun) fs.writeFileSync(absolute, media.content);
    }
  }

  return report;
}

export async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  try {
    const report = fixComponents({ dryRun });
    console.log(
      `${dryRun ? 'Would fix' : 'Fixed'} ${report.paths} image path(s) and framed ${report.framed} element(s) across ${report.files} file(s).`,
    );
    if (report.skipped.length > 0) {
      console.log(`\n${report.skipped.length} left for a person — the context makes wrapping a judgment call:`);
      for (const { file, line, reason } of report.skipped) {
        console.log(`  ${file}:${line} (${reason})`);
      }
    }
  } catch (error) {
    console.error(errorMessage(error));
    process.exitCode = 2;
  }
}

if (isDirectRun(import.meta.url)) await main();
