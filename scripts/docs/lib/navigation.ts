import { lineOf } from './content.ts';

export interface Redirect {
  source: string;
  destination: string;
}

export function collectNavigationPages(docs: Record<string, unknown>): Set<string> {
  const pages = new Set<string>();

  function visit(value: unknown, inPages = false): void {
    if (typeof value === 'string') {
      if (inPages && !/^https?:\/\//.test(value)) pages.add(value.replace(/^\//, ''));
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) visit(item, inPages);
      return;
    }
    if (value === null || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    if (typeof record.root === 'string') pages.add(record.root.replace(/^\//, ''));
    for (const [key, child] of Object.entries(record)) visit(child, key === 'pages');
  }

  visit(docs.navigation);
  return pages;
}

export function containsOpenApi(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsOpenApi);
  if (value === null || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (typeof record.openapi === 'string') return true;
  return Object.values(record).some(containsOpenApi);
}

export function docsJsonLine(content: string, value: string): number {
  const index = content.indexOf(JSON.stringify(value));
  return index < 0 ? 1 : lineOf(content, index);
}

export function redirectsFrom(docs: Record<string, unknown>): Redirect[] {
  if (!Array.isArray(docs.redirects)) return [];
  return docs.redirects.map((value) => {
    const redirect = value as Record<string, string>;
    return {
      source: redirect.source.replace(/^\//, '').replace(/\/$/, ''),
      destination: redirect.destination.replace(/^\//, ''),
    };
  });
}

export interface GroupIcon {
  group: string;
  icon: string;
  depth: number;
}

/**
 * Every group in the navigation tree that carries an icon, with its depth.
 * Depth 0 is a tab's own groups — the top-level product areas.
 */
export function groupIcons(docs: Record<string, unknown>): GroupIcon[] {
  const icons: GroupIcon[] = [];

  function visit(value: unknown, depth: number): void {
    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth);
      return;
    }
    if (value === null || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;

    if (typeof record.tab === 'string') {
      visit(record.pages, 0);
      visit(record.groups, 0);
      return;
    }
    if (typeof record.group === 'string') {
      if (typeof record.icon === 'string') {
        icons.push({ group: record.group, icon: record.icon, depth });
      }
      visit(record.pages, depth + 1);
      return;
    }
    for (const child of Object.values(record)) visit(child, depth);
  }

  visit(docs.navigation, 0);
  return icons;
}
