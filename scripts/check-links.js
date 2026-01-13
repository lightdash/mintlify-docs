#!/usr/bin/env node

/**
 * Checks for broken internal links in MDX files
 * Run: node scripts/check-links.js
 * Run with external link checking: node scripts/check-links.js --external
 */

const fs = require('fs');
const path = require('path');

const CHECK_EXTERNAL = process.argv.includes('--external');

// Regex patterns for finding links
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;
const JSX_LINK_REGEX = /(?:href|src)=["']([^"']+)["']/g;
const ANCHOR_REGEX = /#[^)\s"']*/;

function findMDXFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findMDXFiles(filePath, fileList);
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function extractLinks(content, filePath) {
  const links = [];

  // Extract markdown links: [text](url)
  let match;
  while ((match = MARKDOWN_LINK_REGEX.exec(content)) !== null) {
    links.push({
      text: match[1],
      url: match[2],
      type: 'markdown',
      line: content.substring(0, match.index).split('\n').length
    });
  }

  // Extract JSX links: href="..." or src="..."
  while ((match = JSX_LINK_REGEX.exec(content)) !== null) {
    links.push({
      url: match[1],
      type: 'jsx',
      line: content.substring(0, match.index).split('\n').length
    });
  }

  return links;
}

function isExternalLink(url) {
  return url.startsWith('http://') ||
         url.startsWith('https://') ||
         url.startsWith('//');
}

function isSpecialLink(url) {
  // Skip standard special links
  if (url.startsWith('mailto:') ||
      url.startsWith('tel:') ||
      url.startsWith('#')) {
    return true;
  }

  // Skip template variables
  if (url.includes('{{') || // Handlebars
      url.includes('${') || // JS template literals
      url.includes('<%=') || // ERB/EJS templates
      url.includes('<%')) { // ERB/EJS templates
    return true;
  }

  // Skip placeholder/example URLs
  const placeholderPatterns = [
    'uuid',
    'your-project',
    'your-workspace',
    'example-',
    'dashboard-id',
    'chart-id',
    'project-id',
    'workspace-id',
    'embed-proxy', // Example embed URLs
  ];

  const lowerUrl = url.toLowerCase();
  if (placeholderPatterns.some(pattern => lowerUrl.includes(pattern))) {
    return true;
  }

  return false;
}

function resolveInternalLink(url, sourceFile) {
  // Remove anchor if present
  const urlWithoutAnchor = url.replace(ANCHOR_REGEX, '');

  if (!urlWithoutAnchor) return null; // Just an anchor

  // Handle absolute paths from root
  if (urlWithoutAnchor.startsWith('/')) {
    const possiblePaths = [
      path.join(process.cwd(), urlWithoutAnchor.substring(1)),
      path.join(process.cwd(), urlWithoutAnchor.substring(1) + '.mdx'),
      path.join(process.cwd(), urlWithoutAnchor.substring(1) + '.md'),
    ];

    return possiblePaths;
  }

  // Handle relative paths
  const sourceDir = path.dirname(sourceFile);
  const possiblePaths = [
    path.join(sourceDir, urlWithoutAnchor),
    path.join(sourceDir, urlWithoutAnchor + '.mdx'),
    path.join(sourceDir, urlWithoutAnchor + '.md'),
  ];

  return possiblePaths;
}

function checkInternalLink(url, sourceFile) {
  const possiblePaths = resolveInternalLink(url, sourceFile);

  if (!possiblePaths) return { exists: true }; // Just an anchor, assume valid

  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      return { exists: true, resolvedPath: testPath };
    }
  }

  return { exists: false, triedPaths: possiblePaths };
}

async function checkExternalLink(url) {
  try {
    const https = require('https');
    const http = require('http');
    const client = url.startsWith('https') ? https : http;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ status: 'timeout' });
      }, 5000);

      client.get(url, { timeout: 5000 }, (res) => {
        clearTimeout(timeout);
        resolve({ status: res.statusCode });
      }).on('error', (err) => {
        clearTimeout(timeout);
        resolve({ status: 'error', error: err.message });
      });
    });
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

function loadDocsJson() {
  try {
    const docsPath = path.join(process.cwd(), 'docs.json');
    if (fs.existsSync(docsPath)) {
      return JSON.parse(fs.readFileSync(docsPath, 'utf8'));
    }
  } catch (err) {
    console.warn('⚠️  Could not load docs.json:', err.message);
  }
  return null;
}

function extractPagesFromDocsJson(docsJson) {
  const pages = new Set();

  function traverse(obj) {
    if (Array.isArray(obj)) {
      obj.forEach(traverse);
    } else if (typeof obj === 'object' && obj !== null) {
      if (obj.pages) {
        obj.pages.forEach(page => {
          if (typeof page === 'string') {
            pages.add(page);
          } else {
            traverse(page);
          }
        });
      }
      Object.values(obj).forEach(traverse);
    } else if (typeof obj === 'string') {
      // Single page reference
      pages.add(obj);
    }
  }

  traverse(docsJson);
  return pages;
}

function findOrphanedPages(allMdxFiles, docsJson) {
  if (!docsJson) return [];

  const pagesInNav = extractPagesFromDocsJson(docsJson);
  const orphans = [];

  allMdxFiles.forEach(file => {
    const relativePath = path.relative(process.cwd(), file)
      .replace(/\.(mdx|md)$/, '')
      .replace(/\\/g, '/'); // Normalize Windows paths

    // Skip special files
    if (relativePath.startsWith('snippets/') ||
        relativePath.includes('README') ||
        relativePath.startsWith('.')) {
      return;
    }

    if (!pagesInNav.has(relativePath)) {
      orphans.push(relativePath);
    }
  });

  return orphans;
}

function extractRedirects(docsJson) {
  if (!docsJson || !docsJson.redirects) return [];
  return docsJson.redirects.map(r => ({
    source: r.source.startsWith('/') ? r.source.substring(1) : r.source,
    destination: r.destination.startsWith('/') ? r.destination.substring(1) : r.destination
  }));
}

function validateRedirects(redirects) {
  const issues = [];

  redirects.forEach(redirect => {
    // Check if destination exists
    const possiblePaths = [
      path.join(process.cwd(), redirect.destination),
      path.join(process.cwd(), redirect.destination + '.mdx'),
      path.join(process.cwd(), redirect.destination + '.md'),
    ];

    const exists = possiblePaths.some(p => fs.existsSync(p));

    if (!exists) {
      issues.push({
        source: redirect.source,
        destination: redirect.destination,
        issue: 'Redirect destination does not exist'
      });
    }
  });

  return issues;
}

async function main() {
  console.log('🔍 Checking for broken links in documentation...\n');

  const mdxFiles = findMDXFiles('.');
  const excludedPaths = ['node_modules', '.git', 'CONTRIBUTING.md'];
  const filteredFiles = mdxFiles.filter(file =>
    !excludedPaths.some(excluded => file.includes(excluded))
  );

  console.log(`📄 Found ${filteredFiles.length} documentation files\n`);

  const brokenLinks = [];
  const externalLinks = [];
  let totalLinks = 0;

  // Check links in each file
  for (const file of filteredFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const links = extractLinks(content, file);
    const relativePath = path.relative(process.cwd(), file);

    for (const link of links) {
      totalLinks++;

      if (isSpecialLink(link.url)) {
        continue; // Skip special links
      }

      if (isExternalLink(link.url)) {
        if (CHECK_EXTERNAL) {
          externalLinks.push({ file: relativePath, ...link });
        }
        continue;
      }

      // Check internal link
      const result = checkInternalLink(link.url, file);
      if (!result.exists) {
        brokenLinks.push({
          file: relativePath,
          ...link,
          triedPaths: result.triedPaths
        });
      }
    }
  }

  // Check for orphaned pages
  console.log('🔍 Checking for orphaned pages (not in docs.json)...\n');
  const docsJson = loadDocsJson();
  const orphanedPages = findOrphanedPages(filteredFiles, docsJson);

  // Check redirects
  console.log('🔍 Checking redirects in docs.json...\n');
  const redirects = extractRedirects(docsJson);
  const redirectIssues = validateRedirects(redirects);

  // Display results
  if (brokenLinks.length === 0) {
    console.log('✅ No broken internal links found!\n');
  } else {
    console.log(`❌ Found ${brokenLinks.length} broken internal links:\n`);

    brokenLinks.forEach(({ file, url, line, type, triedPaths }) => {
      console.log(`📄 ${file}:${line}`);
      console.log(`   🔗 Broken link: ${url}`);
      console.log(`   📍 Type: ${type}`);
      if (triedPaths) {
        console.log(`   🔍 Tried paths:`);
        triedPaths.slice(0, 2).forEach(p => {
          console.log(`      - ${path.relative(process.cwd(), p)}`);
        });
      }
      console.log('');
    });
  }

  // Display orphaned pages
  if (orphanedPages.length === 0) {
    console.log('✅ No orphaned pages found!\n');
  } else {
    console.log(`⚠️  Found ${orphanedPages.length} orphaned pages (exist but not in docs.json):\n`);
    orphanedPages.forEach(page => {
      console.log(`   📄 ${page}.mdx`);
    });
    console.log('\n💡 These pages exist but are not linked in docs.json navigation.\n');
  }

  // Display redirect issues
  if (redirectIssues.length === 0) {
    console.log('✅ All redirects are valid!\n');
  } else {
    console.log(`❌ Found ${redirectIssues.length} invalid redirects in docs.json:\n`);
    redirectIssues.forEach(({ source, destination, issue }) => {
      console.log(`   🔀 ${source} → ${destination}`);
      console.log(`   ❌ ${issue}\n`);
    });
    console.log('💡 When moving pages, ensure redirect destinations exist.\n');
  }

  // Check external links if requested
  if (CHECK_EXTERNAL && externalLinks.length > 0) {
    console.log(`🌐 Checking ${externalLinks.length} external links...\n`);

    const brokenExternal = [];
    for (const link of externalLinks) {
      const result = await checkExternalLink(link.url);
      if (result.status >= 400 || result.status === 'error' || result.status === 'timeout') {
        brokenExternal.push({ ...link, status: result.status, error: result.error });
      }
    }

    if (brokenExternal.length === 0) {
      console.log('✅ All external links are working!\n');
    } else {
      console.log(`❌ Found ${brokenExternal.length} broken external links:\n`);
      brokenExternal.forEach(({ file, url, line, status, error }) => {
        console.log(`📄 ${file}:${line}`);
        console.log(`   🔗 ${url}`);
        console.log(`   ❌ Status: ${status}${error ? ` (${error})` : ''}`);
        console.log('');
      });
    }
  }

  // Summary
  console.log('─'.repeat(60));
  console.log(`Total links checked: ${totalLinks}`);
  console.log(`Broken internal links: ${brokenLinks.length}`);
  console.log(`Orphaned pages: ${orphanedPages.length}`);
  console.log(`Invalid redirects: ${redirectIssues.length}`);
  if (CHECK_EXTERNAL) {
    console.log(`External links checked: ${externalLinks.length}`);
  }
  console.log('─'.repeat(60));

  // Exit with error if issues found
  const hasIssues = brokenLinks.length > 0 || orphanedPages.length > 0 || redirectIssues.length > 0;
  process.exit(hasIssues ? 1 : 0);
}

main();
