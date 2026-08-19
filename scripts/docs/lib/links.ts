import fs from 'node:fs';
import path from 'node:path';

import { lineOf, withoutCodeBlocks } from './content.ts';
import { normalizePath, pageFile } from './discovery.ts';
import type { UrlCheckResult } from './types.ts';

export interface LinkReference {
  url: string;
  line: number;
}

export function extractLinks(content: string): LinkReference[] {
  const clean = withoutCodeBlocks(content);
  const links: LinkReference[] = [];
  for (const regex of [/\[[^\]]+\]\(([^)]+)\)/g, /href=["']([^"']+)["']/g]) {
    for (const match of clean.matchAll(regex)) {
      if (match[1] !== undefined && match.index !== undefined) {
        links.push({ url: match[1], line: lineOf(clean, match.index) });
      }
    }
  }
  return links;
}

export function isIgnoredLink(url: string): boolean {
  return /^(https?:)?\/\//.test(url) || /^(mailto:|tel:|#)/.test(url) || /({{|\$\{|<%)/.test(url);
}

export function resolveLink(
  root: string,
  source: string,
  url: string,
): { slug: string; file?: string } | undefined {
  const target = url.split(/[?#]/)[0];
  if (target === undefined || target === '') return undefined;
  const slug = target.startsWith('/')
    ? target.slice(1)
    : normalizePath(path.join(path.dirname(source), target));
  const absolute = path.join(root, slug);
  const directFile = fs.existsSync(absolute) && fs.statSync(absolute).isFile()
    ? normalizePath(path.relative(root, absolute))
    : undefined;
  return { slug: slug.replace(/\.(mdx|md)$/, ''), file: directFile ?? pageFile(root, slug) };
}

export async function requestUrl(url: string): Promise<UrlCheckResult> {
  const response = await fetch(url, {
    method: 'HEAD',
    redirect: 'follow',
    signal: AbortSignal.timeout(10_000),
    headers: { 'user-agent': 'lightdash-docs-link-checker' },
  });
  return { ok: response.status < 400, status: response.status };
}
