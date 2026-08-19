export interface Frontmatter {
  fields: Map<string, string>;
  hidden: boolean;
}

export function parseFrontmatter(content: string): Frontmatter {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (match?.[1] === undefined) return { fields: new Map(), hidden: false };

  const fields = new Map<string, string>();
  for (const line of match[1].split('\n')) {
    const field = line.match(/^([\w-]+):\s*(.*?)\s*$/);
    if (field?.[1] !== undefined && field[2] !== undefined) {
      fields.set(field[1], field[2].replace(/^['"]|['"]$/g, ''));
    }
  }
  return { fields, hidden: fields.get('hidden') === 'true' };
}
