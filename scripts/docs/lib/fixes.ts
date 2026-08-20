import path from 'node:path';

import { componentRegions, isInside } from './components.ts';
import { withoutCodeBlocks } from './content.ts';
import { normalizePath } from './discovery.ts';

export interface FileFix {
  content: string;
  applied: number;
  skipped: { line: number; reason: string }[];
}

const RELATIVE_IMAGE = /(!\[[^\]]*\]\(|<img[^>]*?\ssrc=["'])(\.{1,2}\/[^)"']+)/g;

/**
 * Rewrites `../images/x.png` to `/images/x.png`. Relative paths resolve while
 * authoring and break on the built site, so the root-relative form is the only
 * one that works in both places.
 */
export function fixImagePaths(file: string, content: string): FileFix {
  let applied = 0;
  const directory = path.posix.dirname(normalizePath(file));

  const next = content.replace(RELATIVE_IMAGE, (match, prefix: string, url: string) => {
    const resolved = normalizePath(path.posix.normalize(path.posix.join(directory, url)));
    if (resolved.startsWith('..')) return match;
    applied += 1;
    return `${prefix}/${resolved}`;
  });

  return { content: next, applied, skipped: [] };
}

const MARKDOWN_IMAGE = /^!\[[^\]]*\]\([^)]*\)$/;
const SELF_CONTAINED_TAG = /^<(img|iframe)[^>]*\/?>$/;
const ANY_MEDIA = /!\[[^\]]*\]\(|<img\b|<iframe\b/i;

/** Contexts where a Frame would change the meaning rather than the presentation. */
function skipReason(line: string): string | undefined {
  if (/^\|/.test(line)) return 'table cell';
  if (/^([-*+]|\d+\.)\s/.test(line)) return 'list item';
  if (/^\[/.test(line)) return 'wrapped in a link';
  return undefined;
}

/** Last line of the element opening at `start`, or undefined if it never closes. */
function elementEnd(lines: string[], start: number, tag: string): number | undefined {
  const closing = tag === 'iframe' ? '</iframe>' : undefined;
  for (let index = start; index < lines.length && index < start + 20; index += 1) {
    const line = lines[index];
    if (line === undefined) continue;
    if (closing !== undefined && line.includes(closing)) return index;
    if (closing !== undefined && index === start && /\/>\s*$/.test(line)) return index;
    if (closing === undefined && /\/?>\s*$/.test(line)) return index;
  }
  return undefined;
}

/**
 * Wraps bare images and iframes in `<Frame>`. Frames hold media to the column,
 * so an unwrapped iframe overflows the layout and an unwrapped image sits flush
 * against the prose. Only block-level media is touched; anything sitting inside
 * a sentence, a table, or a link is reported rather than guessed at.
 */
export function wrapBareMedia(content: string): FileFix {
  const regions = componentRegions(content);
  const lines = content.split('\n');
  // Detect against a code-blanked copy so an example is never rewritten. It
  // keeps every line, so indices map straight back onto the real lines.
  const visible = withoutCodeBlocks(content).split('\n');
  const skipped: FileFix['skipped'] = [];
  const spans: { start: number; end: number; indent: string }[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const scan = visible[index];
    if (raw === undefined || scan === undefined) continue;
    const line = scan.trim();
    if (!ANY_MEDIA.test(line)) continue;
    if (isInside(regions, 'Frame', index + 1)) continue;

    const isMarkdown = MARKDOWN_IMAGE.test(line);
    const tag = /^<img\b/.test(line) ? 'img' : /^<iframe\b/i.test(line) ? 'iframe' : undefined;

    // Media that starts its own line can be wrapped; media sitting inside other
    // content cannot, and the reason is worth reporting rather than swallowing.
    const reason = skipReason(line) ?? (isMarkdown || tag !== undefined ? undefined : 'inline with prose');
    if (reason !== undefined) {
      skipped.push({ line: index + 1, reason });
      continue;
    }

    let end = index;
    if (!isMarkdown && tag !== undefined && !SELF_CONTAINED_TAG.test(line)) {
      const found = elementEnd(visible, index, tag);
      if (found === undefined) {
        skipped.push({ line: index + 1, reason: 'element does not close within 20 lines' });
        continue;
      }
      end = found;
    }

    const trailing = visible[end]?.trim() ?? '';
    if (!/>$/.test(trailing) && !MARKDOWN_IMAGE.test(trailing)) {
      skipped.push({ line: index + 1, reason: 'element shares its line with other content' });
      continue;
    }

    spans.push({ start: index, end, indent: raw.slice(0, raw.length - raw.trimStart().length) });
    index = end;
  }

  // Rewrite back to front so earlier offsets stay valid.
  for (const { start, end, indent } of spans.reverse()) {
    lines.splice(end + 1, 0, `${indent}</Frame>`);
    lines.splice(start, 0, `${indent}<Frame>`);
  }

  return { content: lines.join('\n'), applied: spans.length, skipped };
}
