import fs from 'node:fs';
import path from 'node:path';

const PAGE_EXTENSIONS = new Set(['.mdx', '.md']);

export function normalizePath(value: string): string {
  return value.replaceAll('\\', '/').replace(/^\.\//, '');
}

export function readMintignore(root: string): string[] {
  const file = path.join(root, '.mintignore');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
}

function isIgnored(file: string, patterns: string[]): boolean {
  const normalized = normalizePath(file);
  if (normalized.startsWith('.') || normalized.startsWith('node_modules/')) return true;
  if (normalized === 'snippets' || normalized.startsWith('snippets/')) return true;
  if (normalized === 'README.md' || normalized === 'CONTRIBUTING.md') return true;
  return patterns.some((pattern) => {
    const clean = pattern.replace(/\/$/, '');
    return normalized === clean || normalized.startsWith(`${clean}/`);
  });
}

export function findPages(root: string, patterns = readMintignore(root)): string[] {
  const pages: string[] = [];

  function walk(directory: string): void {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const relative = normalizePath(path.relative(root, absolute));
      if (isIgnored(relative, patterns)) continue;
      if (entry.isDirectory()) walk(absolute);
      if (entry.isFile() && PAGE_EXTENSIONS.has(path.extname(entry.name))) pages.push(relative);
    }
  }

  walk(root);
  return pages;
}

export function pageSlug(file: string): string {
  return normalizePath(file).replace(/\.(mdx|md)$/, '');
}

export function pageFile(root: string, slug: string): string | undefined {
  const clean = normalizePath(slug).replace(/^\//, '').split(/[?#]/)[0]?.replace(/\/$/, '');
  if (clean === undefined) return undefined;
  const suffixes = PAGE_EXTENSIONS.has(path.extname(clean))
    ? ['']
    : ['.mdx', '.md', '/index.mdx', '/index.md'];

  for (const suffix of suffixes) {
    const candidate = path.join(root, `${clean}${suffix}`);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return normalizePath(path.relative(root, candidate));
    }
  }
  return undefined;
}
