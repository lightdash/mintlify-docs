const fs = require('node:fs');
const path = require('node:path');

const PAGE_EXTENSIONS = ['.mdx', '.md'];
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
const CODE_BLOCK = /```[\s\S]*?```/g;

function normalize(value) {
  return value.replace(/\\/g, '/').replace(/^\.\//, '');
}

function lineOf(content, index) {
  return content.slice(0, index).split('\n').length;
}

function withoutCodeBlocks(content) {
  return content.replace(CODE_BLOCK, (block) => '\n'.repeat((block.match(/\n/g) || []).length));
}

function readMintignore(root) {
  const file = path.join(root, '.mintignore');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function isIgnored(file, patterns) {
  const normalized = normalize(file);
  if (normalized.startsWith('.') || normalized.startsWith('node_modules/')) return true;
  if (normalized === 'snippets' || normalized.startsWith('snippets/')) return true;
  if (['README.md', 'CONTRIBUTING.md'].includes(normalized)) return true;
  return patterns.some((pattern) => {
    const clean = pattern.replace(/\/$/, '');
    return normalized === clean || normalized.startsWith(`${clean}/`);
  });
}

function findPages(root, patterns) {
  const pages = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const relative = normalize(path.relative(root, absolute));
      if (isIgnored(relative, patterns)) continue;
      if (entry.isDirectory()) walk(absolute);
      if (entry.isFile() && PAGE_EXTENSIONS.includes(path.extname(entry.name))) pages.push(relative);
    }
  }
  walk(root);
  return pages;
}

function pageSlug(file) {
  return normalize(file).replace(/\.(mdx|md)$/, '');
}

function pageFile(root, slug) {
  const clean = normalize(slug).replace(/^\//, '').split(/[?#]/)[0].replace(/\/$/, '');
  const suffixes = PAGE_EXTENSIONS.includes(path.extname(clean))
    ? ['']
    : ['.mdx', '.md', '/index.mdx', '/index.md'];
  for (const suffix of suffixes) {
    const candidate = path.join(root, `${clean}${suffix}`);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return normalize(path.relative(root, candidate));
    }
  }
  return null;
}

function collectNavigationPages(docs) {
  const pages = new Set();
  function visit(value, inPages = false) {
    if (typeof value === 'string') {
      if (inPages && !/^https?:\/\//.test(value)) pages.add(value.replace(/^\//, ''));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, inPages));
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (typeof value.root === 'string') pages.add(value.root.replace(/^\//, ''));
    for (const [key, child] of Object.entries(value)) visit(child, key === 'pages');
  }
  visit(docs.navigation);
  return pages;
}

function containsOpenApi(value) {
  if (Array.isArray(value)) return value.some(containsOpenApi);
  if (!value || typeof value !== 'object') return false;
  if (typeof value.openapi === 'string') return true;
  return Object.values(value).some(containsOpenApi);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { fields: new Map(), hidden: false };
  const fields = new Map();
  for (const line of match[1].split('\n')) {
    const field = line.match(/^([\w-]+):\s*(.*?)\s*$/);
    if (field) fields.set(field[1], field[2].replace(/^['"]|['"]$/g, ''));
  }
  return { fields, hidden: fields.get('hidden') === 'true' };
}

function finding(rule, file, line, message, extra = {}) {
  return { rule, severity: 'error', file, line, message, autoFixable: false, ...extra };
}

function extractLinks(content) {
  const clean = withoutCodeBlocks(content);
  const links = [];
  for (const regex of [/\[[^\]]+\]\(([^)]+)\)/g, /href=["']([^"']+)["']/g]) {
    let match;
    while ((match = regex.exec(clean))) links.push({ url: match[1], line: lineOf(clean, match.index) });
  }
  return links;
}

function isIgnoredLink(url) {
  return /^(https?:)?\/\//.test(url) || /^(mailto:|tel:|#)/.test(url) || /({{|\$\{|<%)/.test(url);
}

function resolveLink(root, source, url) {
  const target = url.split(/[?#]/)[0];
  if (!target) return null;
  const slug = target.startsWith('/')
    ? target.slice(1)
    : normalize(path.join(path.dirname(source), target));
  const absolute = path.join(root, slug);
  const directFile = fs.existsSync(absolute) && fs.statSync(absolute).isFile()
    ? normalize(path.relative(root, absolute))
    : null;
  return { slug: slug.replace(/\.(mdx|md)$/, ''), file: directFile || pageFile(root, slug) };
}

function extractImages(content) {
  const clean = withoutCodeBlocks(content);
  const images = [];
  for (const regex of [/!\[[^\]]*\]\(([^)]+)\)/g, /<img[^>]+src=["']([^"']+)["']/g]) {
    let match;
    while ((match = regex.exec(clean))) {
      if (!/^(https?:)?\/\//.test(match[1])) images.push({ url: match[1], line: lineOf(clean, match.index) });
    }
  }
  return images;
}

function imageFile(root, source, url) {
  const clean = url.split(/[?#]/)[0];
  const absolute = clean.startsWith('/')
    ? path.join(root, clean.slice(1))
    : path.resolve(root, path.dirname(source), clean);
  return { absolute, relative: normalize(path.relative(root, absolute)) };
}

function isCorrectImageLocation(source, image) {
  const expected = `images/${pageSlug(source)}`;
  const actual = normalize(path.dirname(image));
  if (image.includes('/logo/') || image.includes('favicon') || image.includes('/snippets/')) return true;
  return actual === expected || expected.startsWith(`${actual}/`);
}

function docsJsonLine(content, value) {
  const index = content.indexOf(JSON.stringify(value));
  return index < 0 ? 1 : lineOf(content, index);
}

async function validateDocs({ root = process.cwd(), changedFiles } = {}) {
  const patterns = readMintignore(root);
  const pages = findPages(root, patterns);
  const changed = changedFiles ? new Set(changedFiles.map(normalize)) : null;
  const scopedPages = changed ? pages.filter((file) => changed.has(file)) : pages;
  const docsPath = path.join(root, 'docs.json');
  const docsContent = fs.readFileSync(docsPath, 'utf8');
  const docs = JSON.parse(docsContent);
  const navPages = collectNavigationPages(docs);
  const hasGeneratedApi = containsOpenApi(docs.navigation);
  const redirects = (docs.redirects || []).map((redirect) => ({
    source: redirect.source.replace(/^\//, '').replace(/\/$/, ''),
    destination: redirect.destination.replace(/^\//, ''),
  }));
  const redirectSources = new Map(redirects.map((redirect) => [redirect.source, redirect]));
  const findings = [];
  const imageUsage = new Map();

  for (const file of pages) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    for (const image of extractImages(content)) {
      const resolved = imageFile(root, file, image.url).relative;
      if (!imageUsage.has(resolved)) imageUsage.set(resolved, new Set());
      imageUsage.get(resolved).add(file);
    }
  }

  for (const file of scopedPages) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    const { fields } = parseFrontmatter(content);
    for (const field of ['title', 'description']) {
      if (!fields.get(field)) {
        findings.push(finding(`frontmatter.${field}`, file, 1, `Page frontmatter must include ${field}.`));
      }
    }
    for (const link of extractLinks(content)) {
      if (isIgnoredLink(link.url)) continue;
      const resolved = resolveLink(root, file, link.url);
      if (!resolved || resolved.file) continue;
      if (hasGeneratedApi && resolved.slug.startsWith('api-reference/')) continue;
      const redirect = redirectSources.get(resolved.slug.replace(/^\//, '').replace(/\/$/, ''));
      if (redirect) {
        findings.push(finding('link.redirected-internal', file, link.line, `Internal link must target /${redirect.destination} directly.`, { target: link.url }));
      } else {
        findings.push(finding('link.broken-internal', file, link.line, `Internal link does not resolve: ${link.url}`, { target: link.url }));
      }
    }
    for (const image of extractImages(content)) {
      const resolved = imageFile(root, file, image.url);
      if (!fs.existsSync(resolved.absolute)) {
        findings.push(finding('image.missing', file, image.line, `Image does not exist: ${image.url}`, { target: image.url }));
      } else if (!IMAGE_EXTENSIONS.includes(path.extname(resolved.absolute).toLowerCase())) {
        findings.push(finding('image.invalid-type', file, image.line, `Unsupported image type: ${image.url}`, { target: image.url }));
      } else if (imageUsage.get(resolved.relative).size < 2 && !isCorrectImageLocation(file, resolved.relative)) {
        findings.push(finding('image.wrong-location', file, image.line, `Image belongs under images/${pageSlug(file)}/ or a shared parent directory.`, { target: image.url, autoFixable: true }));
      }
    }
  }

  const scopeIncludesDocsJson = !changed || changed.has('docs.json');
  for (const slug of navPages) {
    if (pageFile(root, slug)) continue;
    const candidates = [`${slug}.mdx`, `${slug}.md`];
    if (scopeIncludesDocsJson || (changed && candidates.some((file) => changed.has(file)))) {
      findings.push(finding('navigation.missing-page', 'docs.json', docsJsonLine(docsContent, slug), `Navigation entry does not resolve: ${slug}`, { target: slug }));
    }
  }

  for (const file of scopedPages) {
    const { hidden } = parseFrontmatter(fs.readFileSync(path.join(root, file), 'utf8'));
    if (!hidden && !navPages.has(pageSlug(file))) {
      findings.push(finding('navigation.orphaned-page', file, 1, 'Published page is not reachable from navigation.'));
    }
  }

  if (scopeIncludesDocsJson) {
    for (const redirect of redirects) {
      const line = docsJsonLine(docsContent, `/${redirect.source}`);
      const destinationSlug = redirect.destination.split(/[?#]/)[0].replace(/\/$/, '');
      if (redirectSources.has(destinationSlug)) {
        findings.push(finding('redirect.chain', 'docs.json', line, `Redirect must point directly to its final destination: /${redirect.destination}`, { target: `/${redirect.source}` }));
      }
      if (!pageFile(root, destinationSlug)) {
        findings.push(finding('redirect.missing-destination', 'docs.json', line, `Redirect destination does not resolve: /${redirect.destination}`, { target: `/${redirect.source}` }));
      }
    }
  }

  findings.sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line || left.rule.localeCompare(right.rule));
  return {
    schemaVersion: 1,
    status: findings.length ? 'failed' : 'passed',
    scope: changed ? 'changed' : 'all',
    summary: {
      errors: findings.length,
      autoFixable: findings.filter(({ autoFixable }) => autoFixable).length,
    },
    findings,
  };
}

async function requestUrl(url) {
  const response = await fetch(url, {
    method: 'HEAD',
    redirect: 'follow',
    signal: AbortSignal.timeout(10000),
    headers: { 'user-agent': 'lightdash-docs-link-checker' },
  });
  return { ok: response.status < 400, status: response.status };
}

async function checkExternalLinks({ root = process.cwd(), checkUrl = requestUrl } = {}) {
  const pages = findPages(root, readMintignore(root));
  const references = [];
  for (const file of pages) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    for (const link of extractLinks(content)) {
      if (/^https?:\/\//.test(link.url)) references.push({ file, line: link.line, url: link.url });
    }
  }

  const results = new Map();
  const urls = [...new Set(references.map(({ url }) => url))];
  for (let index = 0; index < urls.length; index += 10) {
    const batch = urls.slice(index, index + 10);
    const checks = await Promise.all(batch.map(async (url) => {
      try {
        return [url, await checkUrl(url)];
      } catch (error) {
        return [url, { ok: false, status: 'error', error: error.message }];
      }
    }));
    checks.forEach(([url, result]) => results.set(url, result));
  }

  const findings = references
    .filter(({ url }) => !results.get(url).ok)
    .map(({ file, line, url }) => {
      const result = results.get(url);
      const detail = result.error || `HTTP ${result.status}`;
      return finding('external.unreachable', file, line, `External link is unavailable (${detail}): ${url}`, {
        severity: 'warning',
        target: url,
      });
    });
  return {
    schemaVersion: 1,
    status: findings.length ? 'advisory' : 'passed',
    scope: 'all',
    summary: { warnings: findings.length },
    findings,
  };
}

module.exports = { checkExternalLinks, validateDocs };
