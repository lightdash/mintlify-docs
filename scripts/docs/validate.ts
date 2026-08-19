#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { argument, errorMessage, isDirectRun, writeJsonReport } from './lib/command.ts';
import { findPages, normalizePath, pageFile, pageSlug, readMintignore } from './lib/discovery.ts';
import { buildWorkflowAnnotations, createFinding } from './lib/findings.ts';
import { parseFrontmatter } from './lib/frontmatter.ts';
import { extractImages, imageFile, IMAGE_EXTENSIONS, isCorrectImageLocation } from './lib/images.ts';
import { extractLinks, isIgnoredLink, resolveLink } from './lib/links.ts';
import {
  collectNavigationPages,
  containsOpenApi,
  docsJsonLine,
  redirectsFrom,
} from './lib/navigation.ts';
import type { Finding, ValidationReport } from './lib/types.ts';

export interface ValidateDocsOptions {
  root?: string;
  changedFiles?: string[];
}

export async function validateDocs({
  root = process.cwd(),
  changedFiles,
}: ValidateDocsOptions = {}): Promise<ValidationReport> {
  const pages = findPages(root, readMintignore(root));
  const changed = changedFiles === undefined
    ? undefined
    : new Set(changedFiles.map(normalizePath));
  const scopedPages = changed === undefined ? pages : pages.filter((file) => changed.has(file));
  const docsPath = path.join(root, 'docs.json');
  const docsContent = fs.readFileSync(docsPath, 'utf8');
  const docs = JSON.parse(docsContent) as Record<string, unknown>;
  const navPages = collectNavigationPages(docs);
  const hasGeneratedApi = containsOpenApi(docs.navigation);
  const redirects = redirectsFrom(docs);
  const redirectSources = new Map(redirects.map((redirect) => [redirect.source, redirect]));
  const findings: Finding[] = [];
  const imageUsage = new Map<string, Set<string>>();

  for (const file of pages) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    for (const image of extractImages(content)) {
      const resolved = imageFile(root, file, image.url).relative;
      const usage = imageUsage.get(resolved) ?? new Set<string>();
      usage.add(file);
      imageUsage.set(resolved, usage);
    }
  }

  for (const file of scopedPages) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    const { fields } = parseFrontmatter(content);
    for (const field of ['title', 'description']) {
      if (!fields.get(field)) {
        findings.push(createFinding(
          `frontmatter.${field}`,
          file,
          1,
          `Page frontmatter must include ${field}.`,
        ));
      }
    }

    for (const link of extractLinks(content)) {
      if (isIgnoredLink(link.url)) continue;
      const resolved = resolveLink(root, file, link.url);
      if (resolved === undefined || resolved.file !== undefined) continue;
      if (hasGeneratedApi && resolved.slug.startsWith('api-reference/')) continue;
      const redirect = redirectSources.get(resolved.slug.replace(/^\//, '').replace(/\/$/, ''));
      findings.push(redirect === undefined
        ? createFinding(
            'link.broken-internal',
            file,
            link.line,
            `Internal link does not resolve: ${link.url}`,
            { target: link.url },
          )
        : createFinding(
            'link.redirected-internal',
            file,
            link.line,
            `Internal link must target /${redirect.destination} directly.`,
            { target: link.url },
          ));
    }

    for (const image of extractImages(content)) {
      const resolved = imageFile(root, file, image.url);
      if (!fs.existsSync(resolved.absolute)) {
        findings.push(createFinding(
          'image.missing',
          file,
          image.line,
          `Image does not exist: ${image.url}`,
          { target: image.url },
        ));
      } else if (!IMAGE_EXTENSIONS.has(path.extname(resolved.absolute).toLowerCase())) {
        findings.push(createFinding(
          'image.invalid-type',
          file,
          image.line,
          `Unsupported image type: ${image.url}`,
          { target: image.url },
        ));
      } else if ((imageUsage.get(resolved.relative)?.size ?? 0) < 2 && !isCorrectImageLocation(file, resolved.relative)) {
        findings.push(createFinding(
          'image.wrong-location',
          file,
          image.line,
          `Image belongs under images/${pageSlug(file)}/ or a shared parent directory.`,
          { target: image.url, autoFixable: true },
        ));
      }
    }
  }

  const scopeIncludesDocsJson = changed === undefined || changed.has('docs.json');
  for (const slug of navPages) {
    if (pageFile(root, slug) !== undefined) continue;
    const candidates = [`${slug}.mdx`, `${slug}.md`];
    if (scopeIncludesDocsJson || candidates.some((file) => changed?.has(file) === true)) {
      findings.push(createFinding(
        'navigation.missing-page',
        'docs.json',
        docsJsonLine(docsContent, slug),
        `Navigation entry does not resolve: ${slug}`,
        { target: slug },
      ));
    }
  }

  for (const file of scopedPages) {
    const { hidden } = parseFrontmatter(fs.readFileSync(path.join(root, file), 'utf8'));
    if (!hidden && !navPages.has(pageSlug(file))) {
      findings.push(createFinding(
        'navigation.orphaned-page',
        file,
        1,
        'Published page is not reachable from navigation.',
      ));
    }
  }

  if (scopeIncludesDocsJson) {
    for (const redirect of redirects) {
      const line = docsJsonLine(docsContent, `/${redirect.source}`);
      const destinationSlug = (redirect.destination.split(/[?#]/)[0] ?? '').replace(/\/$/, '');
      if (redirectSources.has(destinationSlug)) {
        findings.push(createFinding(
          'redirect.chain',
          'docs.json',
          line,
          `Redirect must point directly to its final destination: /${redirect.destination}`,
          { target: `/${redirect.source}` },
        ));
      }
      if (pageFile(root, destinationSlug) === undefined) {
        findings.push(createFinding(
          'redirect.missing-destination',
          'docs.json',
          line,
          `Redirect destination does not resolve: /${redirect.destination}`,
          { target: `/${redirect.source}` },
        ));
      }
    }
  }

  findings.sort((left, right) => (
    left.file.localeCompare(right.file) || left.line - right.line || left.rule.localeCompare(right.rule)
  ));

  return {
    schemaVersion: 1,
    status: findings.length === 0 ? 'passed' : 'failed',
    scope: changed === undefined ? 'all' : 'changed',
    summary: {
      errors: findings.length,
      autoFixable: findings.filter(({ autoFixable }) => autoFixable).length,
    },
    findings,
  };
}

export async function main(): Promise<void> {
  const output = argument('--output');
  const changedFileList = argument('--changed-files');

  try {
    const changedFiles = changedFileList === undefined
      ? undefined
      : fs.readFileSync(changedFileList, 'utf8').split('\n').map((line) => line.trim()).filter(Boolean);
    const report = await validateDocs({ changedFiles });
    writeJsonReport(output, report);

    if (process.env.GITHUB_ACTIONS === 'true') {
      const annotations = buildWorkflowAnnotations(report.findings);
      for (const command of annotations.commands) console.log(command);
      if (annotations.omitted > 0) {
        console.log(`${annotations.omitted} finding(s) omitted from annotations; see the JSON artifact.`);
      }
    }

    console.log(
      `${report.status.toUpperCase()}: ${report.summary.errors} error(s), ${report.summary.autoFixable} auto-fixable`,
    );
    for (const item of report.findings) {
      console.log(`${item.file}:${item.line} [${item.rule}] ${item.message}`);
    }
    process.exitCode = report.status === 'passed' ? 0 : 1;
  } catch (error) {
    const report = {
      schemaVersion: 1,
      status: 'tool_failure',
      scope: changedFileList === undefined ? 'all' : 'changed',
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
