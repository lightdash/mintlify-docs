const CODE_BLOCK = /```[\s\S]*?```/g;
const INLINE_CODE = /`[^`\n]*`/g;

export function lineOf(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

/**
 * Content with code removed, so an element named in an example is never read as
 * a real one. Fenced blocks collapse to their newlines and inline spans to
 * spaces, which keeps every surviving line and column offset intact.
 */
export function withoutCodeBlocks(content: string): string {
  return content
    .replace(CODE_BLOCK, (block) => '\n'.repeat(block.match(/\n/g)?.length ?? 0))
    .replace(INLINE_CODE, (span) => ' '.repeat(span.length));
}
