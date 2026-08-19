#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { isDirectRun } from './lib/command.ts';

interface Annotation {
  for?: string;
  not?: string;
}

interface IaNode {
  key: string;
  name: string;
  type: 'area' | 'section';
  depth: number;
}

export interface RenderIaMapOptions {
  root?: string;
}

function parseAnnotations(text: string, file: string): Record<string, Annotation> {
  const annotations: Record<string, Annotation> = {};
  let current: string | undefined;

  for (const [index, raw] of text.split('\n').entries()) {
    const line = raw.replace(/\s+$/, '');
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    const top = line.match(/^([^\s#][^:]*):\s*$/);
    if (top?.[1] !== undefined) {
      current = top[1].trim();
      annotations[current] = {};
      continue;
    }
    const field = line.match(/^\s+(for|not):\s*(.+)$/);
    if (field?.[1] !== undefined && field[2] !== undefined) {
      if (current === undefined) throw new Error(`${file}:${index + 1}: field before any key`);
      const annotation = annotations[current];
      if (annotation !== undefined) annotation[field[1] as 'for' | 'not'] = field[2].trim();
      continue;
    }
    throw new Error(`${file}:${index + 1}: cannot parse "${line}"`);
  }

  return annotations;
}

function collectNodes(navigation: unknown): IaNode[] {
  const nodes: IaNode[] = [];

  function walk(node: unknown, depth: number): void {
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth);
      return;
    }
    if (node === null || typeof node !== 'object') return;
    const record = node as Record<string, unknown>;
    if (typeof record.group === 'string') {
      if (record.openapi !== undefined) return;
      const root = typeof record.root === 'string' ? record.root : undefined;
      nodes.push({
        key: root ?? record.group,
        name: record.group,
        type: root === undefined ? 'section' : 'area',
        depth,
      });
      walk(record.pages ?? [], depth + 1);
      return;
    }
    for (const value of Object.values(record)) walk(value, depth);
  }

  walk(navigation, 0);
  return nodes;
}

export function renderIaMap({
  root = path.resolve(import.meta.dirname, '../..'),
}: RenderIaMapOptions = {}): { output: string; unannotated: string[]; orphans: string[] } {
  const docs = JSON.parse(fs.readFileSync(path.join(root, 'docs.json'), 'utf8')) as Record<string, unknown>;
  const mapFile = path.join(root, '.mintlify', 'ia-map.yml');
  const annotations = parseAnnotations(fs.readFileSync(mapFile, 'utf8'), mapFile);
  const nodes = collectNodes(docs.navigation);
  const unannotated: string[] = [];
  const seen = new Set<string>();
  const lines = ['', 'Docs IA — structure from docs.json, placement from .mintlify/ia-map.yml', ''];

  for (const { key, name, type, depth } of nodes) {
    const pad = '  '.repeat(depth);
    const note = annotations[key];
    seen.add(key);
    lines.push(`${pad}${name}  [${type}${type === 'area' ? `: ${key}` : ''}]`);
    if (note?.for !== undefined) lines.push(`${pad}    for: ${note.for}`);
    if (note?.not !== undefined) lines.push(`${pad}    not: ${note.not}`);
    if (note === undefined) {
      lines.push(`${pad}    ⚠ no annotation — add "${key}:" to .mintlify/ia-map.yml`);
      unannotated.push(key);
    }
  }

  const orphans = Object.keys(annotations).filter((key) => !seen.has(key));
  lines.push('');
  if (unannotated.length > 0) {
    lines.push(`⚠ ${unannotated.length} node(s) without an annotation:`, ...unannotated.map((key) => `   ${key}`));
  }
  if (orphans.length > 0) {
    lines.push(`⚠ ${orphans.length} annotation(s) with no matching node:`, ...orphans.map((key) => `   ${key}`));
  }
  if (unannotated.length === 0 && orphans.length === 0) {
    lines.push(`✅ ${nodes.length} nodes, all annotated, no orphans.`);
  }

  return { output: lines.join('\n'), unannotated, orphans };
}

export function main(): void {
  const result = renderIaMap();
  console.log(result.output);
  if (process.argv.includes('--check') && (result.unannotated.length > 0 || result.orphans.length > 0)) {
    process.exitCode = 1;
  }
}

if (isDirectRun(import.meta.url)) main();
