import { withoutCodeBlocks } from './content.ts';

export interface ProseMatch {
  line: number;
  /** The word, phrase, or heading that tripped the rule. */
  text: string;
}

/**
 * Words the writing guide bans because they claim ease or quality instead of
 * describing the product. "just" is banned too, but it has too many literal
 * uses ("just before", "just one") to match mechanically.
 */
const FILLER_WORD = /\b(simply|easily|seamless(?:ly)?|powerful)\b/gi;

/**
 * What the screen does after an action the reader already took. Kept to the
 * phrasings that are never an instruction; "the menu appears once…" can be a
 * condition the reader needs, so it is left to review.
 */
const INTERFACE_NARRATION = new RegExp(
  [
    String.raw`\b(?:notification|toast) (?:confirms|appears)\b`,
    String.raw`\bconfirmation(?: (?:dialog|modal|prompt|message))? (?:opens|appears|will open|will appear)\b`,
    String.raw`\bsuccess (?:message|notification|toast)\b`,
  ].join('|'),
  'gi',
);

const SAME_PAGE_LINK = /\]\((#[^)\s]+)\)/g;

/** Same-page links one paragraph may carry before it reads as a table of contents. */
export const MAX_ANCHOR_LINKS = 3;

const HEADING = /^#{1,6}\s+(.+?)\s*$/;

function proseLines(content: string): string[] {
  return withoutCodeBlocks(content).split('\n');
}

function matchesPerLine(content: string, pattern: RegExp): ProseMatch[] {
  const matches: ProseMatch[] = [];
  proseLines(content).forEach((text, index) => {
    for (const match of text.matchAll(pattern)) {
      matches.push({ line: index + 1, text: match[0] });
    }
  });
  return matches;
}

export function fillerWords(content: string): ProseMatch[] {
  return matchesPerLine(content, FILLER_WORD);
}

export function interfaceNarration(content: string): ProseMatch[] {
  return matchesPerLine(content, INTERFACE_NARRATION);
}

/**
 * Paragraphs that link to more than MAX_ANCHOR_LINKS sections of their own
 * page. Table rows are left alone: a lookup table links each row to its entry.
 */
export function anchorIndexes(content: string): ProseMatch[] {
  const matches: ProseMatch[] = [];
  proseLines(content).forEach((text, index) => {
    if (text.trimStart().startsWith('|')) return;
    const targets = new Set([...text.matchAll(SAME_PAGE_LINK)].map((match) => match[1]));
    if (targets.size > MAX_ANCHOR_LINKS) matches.push({ line: index + 1, text: String(targets.size) });
  });
  return matches;
}

function headings(content: string): ProseMatch[] {
  const found: ProseMatch[] = [];
  proseLines(content).forEach((text, index) => {
    // A badge on the heading is not part of its wording.
    const title = HEADING.exec(text)?.[1]
      ?.replace(/<([A-Za-z]+)[^>]*>.*?<\/\1>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (title !== undefined && title !== '') found.push({ line: index + 1, text: title });
  });
  return found;
}

export function overviewHeadings(content: string): ProseMatch[] {
  return headings(content).filter(({ text }) => /^overview$/i.test(text));
}

export function questionHeadings(content: string): ProseMatch[] {
  return headings(content).filter(({ text }) => text.endsWith('?'));
}
