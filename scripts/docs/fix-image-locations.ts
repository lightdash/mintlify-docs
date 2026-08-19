#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { isDirectRun } from './lib/command.ts';
import { findPages, normalizePath, pageSlug } from './lib/discovery.ts';
import { extractImages, imageFile, isCorrectImageLocation, isSpecialImage } from './lib/images.ts';

interface ImageUsage {
  file: string;
  imagePath: string;
  line: number;
}

export interface ImageLocationIssue {
  type: 'missing';
  image: string;
  usages: string[];
}

export interface ImageLocationFix {
  from: string;
  to: string;
  absoluteFrom: string;
  absoluteTo: string;
  usages: ImageUsage[];
}

export interface FixImageLocationsOptions {
  root?: string;
  dryRun?: boolean;
}

function expectedImageDirectory(root: string, page: string): string {
  return path.join(root, 'images', pageSlug(normalizePath(path.relative(root, page))));
}

function commonImageDirectory(root: string, usages: ImageUsage[]): string {
  const parts = usages.map(({ file }) => [
    'images',
    ...pageSlug(normalizePath(path.relative(root, file))).split('/'),
  ]);
  const first = parts[0] ?? ['images'];
  const common = first.filter((part, index) => parts.every((value) => value[index] === part));
  return path.join(root, ...(common.length === 0 ? ['images'] : common));
}

function correctLocation(root: string, image: string, usages: ImageUsage[]): string {
  const directory = usages.length === 1
    ? expectedImageDirectory(root, usages[0]?.file ?? '')
    : commonImageDirectory(root, usages);
  return path.join(directory, path.basename(image));
}

function escapedRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updateImageReference(file: string, oldPath: string, newPath: string): boolean {
  const content = fs.readFileSync(file, 'utf8');
  const relative = normalizePath(path.relative(path.dirname(file), newPath));
  const escaped = escapedRegExp(oldPath);
  const markdown = new RegExp(`(!\\[[^\\]]*\\]\\()${escaped}(\\))`, 'g');
  const jsx = new RegExp(`(<img[^>]+src=["'])${escaped}(["'])`, 'g');
  const updated = content.replace(markdown, `$1${relative}$2`).replace(jsx, `$1${relative}$2`);
  if (updated === content) return false;
  fs.writeFileSync(file, updated);
  return true;
}

function imageUsage(root: string): Map<string, ImageUsage[]> {
  const usage = new Map<string, ImageUsage[]>();
  for (const file of findPages(root)) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    for (const image of extractImages(content)) {
      const absolute = imageFile(root, file, image.url).absolute;
      const references = usage.get(absolute) ?? [];
      references.push({ file: path.join(root, file), imagePath: image.url, line: image.line });
      usage.set(absolute, references);
    }
  }
  return usage;
}

export function fixImageLocations({
  root = process.cwd(),
  dryRun = false,
}: FixImageLocationsOptions = {}): { fixes: ImageLocationFix[]; issues: ImageLocationIssue[] } {
  const fixes: ImageLocationFix[] = [];
  const issues: ImageLocationIssue[] = [];

  for (const [absoluteImage, usages] of imageUsage(root)) {
    const relativeImage = normalizePath(path.relative(root, absoluteImage));
    if (!fs.existsSync(absoluteImage)) {
      issues.push({
        type: 'missing',
        image: relativeImage,
        usages: usages.map(({ file, line }) => `${normalizePath(path.relative(root, file))}:${line}`),
      });
      continue;
    }
    if (isSpecialImage(relativeImage)) continue;
    const allWrong = usages.every(({ file }) => (
      !isCorrectImageLocation(normalizePath(path.relative(root, file)), relativeImage)
    ));
    if (!allWrong) continue;
    const absoluteTo = correctLocation(root, absoluteImage, usages);
    fixes.push({
      from: relativeImage,
      to: normalizePath(path.relative(root, absoluteTo)),
      absoluteFrom: absoluteImage,
      absoluteTo,
      usages,
    });
  }

  if (!dryRun) {
    for (const fix of fixes) {
      fs.mkdirSync(path.dirname(fix.absoluteTo), { recursive: true });
      fs.renameSync(fix.absoluteFrom, fix.absoluteTo);
      for (const usage of fix.usages) {
        updateImageReference(usage.file, usage.imagePath, fix.absoluteTo);
      }
    }
  }

  return { fixes, issues };
}

function help(): void {
  console.log('Usage: node scripts/docs/fix-image-locations.ts [--dry-run]');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run    Show what would change without modifying files');
  console.log('  --help       Show this help message');
}

export function main(): void {
  if (process.argv.includes('--help')) {
    help();
    return;
  }
  const dryRun = process.argv.includes('--dry-run');
  const { fixes, issues } = fixImageLocations({ dryRun });

  for (const issue of issues) {
    console.log(`MISSING ${issue.image}: ${issue.usages.join(', ')}`);
  }
  for (const fix of fixes) console.log(`${dryRun ? 'WOULD MOVE' : 'MOVED'} ${fix.from} -> ${fix.to}`);
  if (fixes.length === 0) console.log('No image location fixes needed.');
}

if (isDirectRun(import.meta.url)) main();
