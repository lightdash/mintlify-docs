const CODE_BLOCK = /```[\s\S]*?```/g;

export function lineOf(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

export function withoutCodeBlocks(content: string): string {
  return content.replace(CODE_BLOCK, (block) => '\n'.repeat(block.match(/\n/g)?.length ?? 0));
}
