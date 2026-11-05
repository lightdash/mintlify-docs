export interface SidebarEntry { title: string; href: string; parents: string[] }
interface Operation {
  summary?: string;
  tags?: string[];
  'x-hidden'?: boolean;
  'x-excluded'?: boolean;
  'x-mint'?: { href?: string; metadata?: { title?: string; sidebarTitle?: string } };
}
export interface ApiSchema { paths: Record<string, Record<string, unknown>> }

// Mintlify's filenameUtils and slugToTitle define the generated route contract.
function filename(value?: string): string | undefined {
  return value ? value.replaceAll(' ', '-').replace(/\{.*?\}/g, '-')
    .replace(/^-/, '').replace(/-$/, '').replace(/[{}(),.'\n/]/g, '')
    .replaceAll(/--/g, '-').toLowerCase() : undefined;
}

export function apiSidebarEntries(schema: ApiSchema, parents: string[]): SidebarEntry[] {
  const used = new Set<string>();
  const entries: SidebarEntry[] = [];
  for (const [path, operations] of Object.entries(schema.paths)) {
    for (const [method, value] of Object.entries(operations)) {
      if (!['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'].includes(method)) continue;
      const operation = value as Operation;
      if (operation['x-excluded']) continue;
      if ((operation as Record<string, unknown>).$ref) throw new Error(`Resolve OpenAPI operation reference: ${path}`);
      const tag = operation.tags?.[0];
      const slug = filename(operation.summary) ?? `${method}-${filename(path)}`;
      const base = operation['x-mint']?.href?.replace(/^\//, '')
        ?? ['api-reference', filename(tag), slug].filter(Boolean).join('/');
      let route = base;
      for (let count = 1; used.has(route); count++) route = `${base}-${count}`;
      used.add(route);
      if (operation['x-hidden']) continue;
      const fallback = route.split('/').at(-1)!.replace(/[-_]/g, ' ');
      const metadata = operation['x-mint']?.metadata;
      entries.push({
        title: metadata?.sidebarTitle ?? metadata?.title ?? operation.summary
          ?? fallback.charAt(0).toUpperCase() + fallback.slice(1),
        href: `/${route}`,
        parents: [...parents, tag ?? 'API Reference'],
      });
    }
  }
  return entries;
}
