export interface PullRequestReference {
  number: number;
  reason: 'body source reference' | 'body contextual source reference';
}

const HANDLE_ALIASES = new Map([
  ['tatiana', 'tatianainama'],
  ['tatiana-inama', 'tatianainama'],
]);

export function normalizeHandle(handle: string): string {
  return HANDLE_ALIASES.get(handle.toLowerCase()) ?? handle;
}

export function resolvePullRequestReference(body: string): PullRequestReference | undefined {
  const direct = body.match(/lightdash\/lightdash(?:#|\/pull\/)(\d+)/i);
  if (direct?.[1] !== undefined) {
    return { number: Number(direct[1]), reason: 'body source reference' };
  }
  const contextual = body.match(/(?:upstream PR|source PR|triggered by|follows|follow-up to)[^#]{0,120}#(\d{5,})/is);
  if (contextual?.[1] !== undefined) {
    return { number: Number(contextual[1]), reason: 'body contextual source reference' };
  }
  return undefined;
}

export function resolveCcHandle(body: string): string | undefined {
  return body.match(/(?:^|\n)\s*cc\s+@([A-Za-z0-9-]+)/i)?.[1];
}

export function isBot(handle: string): boolean {
  return handle.endsWith('[bot]');
}
