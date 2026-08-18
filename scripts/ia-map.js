#!/usr/bin/env node

/**
 * Prints the docs IA as a walkable tree: the structure derived live from
 * docs.json, joined with the placement annotations in .mintlify/ia-map.yml.
 *
 * The structure is never duplicated, so it cannot drift. The annotations are
 * the only hand-maintained part, and this script reports both kinds of gap:
 * nodes with no annotation, and annotations whose node no longer exists.
 *
 * Run:        node scripts/ia-map.js
 * In CI:      node scripts/ia-map.js --check   (exit 1 if anything is unmapped)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOCS_JSON = path.join(ROOT, 'docs.json');
const MAP_FILE = path.join(ROOT, '.mintlify', 'ia-map.yml');
const CHECK = process.argv.includes('--check');

/**
 * Minimal parser for this file's shape: top-level `key:` entries, each with
 * indented `for:` / `not:` scalars. Deliberately not a general YAML parser —
 * the format is fixed and the repo has no dependencies.
 */
function parseAnnotations(text) {
  const out = {};
  let current = null;
  text.split('\n').forEach((raw, i) => {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim() || line.trim().startsWith('#')) return;
    const top = line.match(/^([^\s#][^:]*):\s*$/);
    if (top) {
      current = top[1].trim();
      out[current] = {};
      return;
    }
    const field = line.match(/^\s+(for|not):\s*(.+)$/);
    if (field) {
      if (!current) throw new Error(`${MAP_FILE}:${i + 1}: field before any key`);
      out[current][field[1]] = field[2].trim();
      return;
    }
    throw new Error(`${MAP_FILE}:${i + 1}: cannot parse "${line}"`);
  });
  return out;
}

/** Walk docs.json navigation, yielding every group in order with its depth. */
function collectNodes(nav) {
  const nodes = [];
  (function walk(node, depth) {
    if (Array.isArray(node)) return node.forEach((n) => walk(n, depth));
    if (!node || typeof node !== 'object') return;
    if (node.group) {
      if (node.openapi) return; // generated, not part of the IA
      nodes.push({
        key: node.root || node.group,
        name: node.group,
        type: node.root ? 'area' : 'section',
        depth,
      });
      (node.pages || []).forEach((p) => walk(p, depth + 1));
      return;
    }
    Object.values(node).forEach((v) => walk(v, depth));
  })(nav, 0);
  return nodes;
}

function main() {
  const docs = JSON.parse(fs.readFileSync(DOCS_JSON, 'utf8'));
  const annotations = parseAnnotations(fs.readFileSync(MAP_FILE, 'utf8'));
  const nodes = collectNodes(docs.navigation);

  const unannotated = [];
  const seen = new Set();

  console.log('\nDocs IA — structure from docs.json, placement from .mintlify/ia-map.yml\n');

  nodes.forEach(({ key, name, type, depth }) => {
    const pad = '  '.repeat(depth);
    const note = annotations[key];
    seen.add(key);
    console.log(`${pad}${name}  [${type}${type === 'area' ? `: ${key}` : ''}]`);
    if (note && note.for) console.log(`${pad}    for: ${note.for}`);
    if (note && note.not) console.log(`${pad}    not: ${note.not}`);
    if (!note) {
      console.log(`${pad}    ⚠ no annotation — add "${key}:" to .mintlify/ia-map.yml`);
      unannotated.push(key);
    }
  });

  const orphans = Object.keys(annotations).filter((k) => !seen.has(k));

  console.log('');
  if (unannotated.length) {
    console.log(`⚠ ${unannotated.length} node(s) without an annotation:`);
    unannotated.forEach((k) => console.log(`   ${k}`));
  }
  if (orphans.length) {
    console.log(`⚠ ${orphans.length} annotation(s) with no matching node (renamed or removed?):`);
    orphans.forEach((k) => console.log(`   ${k}`));
  }
  if (!unannotated.length && !orphans.length) {
    console.log(`✅ ${nodes.length} nodes, all annotated, no orphans.`);
  }

  if (CHECK && (unannotated.length || orphans.length)) process.exit(1);
}

main();
