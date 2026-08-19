import path from 'node:path';

import { lineOf, withoutCodeBlocks } from './content.ts';
import { normalizePath, pageSlug } from './discovery.ts';

export const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']);

export interface ImageReference {
  url: string;
  line: number;
  alt?: string;
  type: 'markdown' | 'jsx';
}

export function extractImages(content: string): ImageReference[] {
  const clean = withoutCodeBlocks(content);
  const images: ImageReference[] = [];

  for (const match of clean.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
    if (match[2] !== undefined && match.index !== undefined && !/^(https?:)?\/\//.test(match[2])) {
      images.push({ url: match[2], line: lineOf(clean, match.index), alt: match[1], type: 'markdown' });
    }
  }
  for (const match of clean.matchAll(/<img[^>]+src=["']([^"']+)["']/g)) {
    if (match[1] !== undefined && match.index !== undefined && !/^(https?:)?\/\//.test(match[1])) {
      images.push({ url: match[1], line: lineOf(clean, match.index), type: 'jsx' });
    }
  }

  return images;
}

export function imageFile(
  root: string,
  source: string,
  url: string,
): { absolute: string; relative: string } {
  const clean = url.split(/[?#]/)[0] ?? '';
  const absolute = clean.startsWith('/')
    ? path.join(root, clean.slice(1))
    : path.resolve(root, path.dirname(source), clean);
  return { absolute, relative: normalizePath(path.relative(root, absolute)) };
}

export function isSpecialImage(image: string): boolean {
  return image.includes('/logo/') || image.includes('favicon') || image.includes('/snippets/');
}

export function isCorrectImageLocation(source: string, image: string): boolean {
  const expected = `images/${pageSlug(source)}`;
  const actual = normalizePath(path.dirname(image));
  return isSpecialImage(image) || actual === expected || expected.startsWith(`${actual}/`);
}
