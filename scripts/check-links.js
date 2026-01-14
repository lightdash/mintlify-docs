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
const CODE_BLOCK_REGEX = /```[\s\S]*?```/g;

function removeCodeBlocks(content) {
  // Replace code blocks with same number of newlines to preserve line numbers
  return content.replace(CODE_BLOCK_REGEX, (match) => {
    const newlineCount = (match.match(/\n/g) || []).length;
    return '\n'.repeat(newlineCount);
  });
}

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

  // Remove code blocks to avoid flagging example links
  const contentWithoutCodeBlocks = removeCodeBlocks(content);

  // Extract markdown links: [text](url)
  let match;
  while ((match = MARKDOWN_LINK_REGEX.exec(contentWithoutCodeBlocks)) !== null) {
    links.push({
      text: match[1],
      url: match[2],
      type: 'markdown',
      line: contentWithoutCodeBlocks.substring(0, match.index).split('\n').length
    });
  }

  // Extract JSX links: href="..." or src="..."
  while ((match = JSX_LINK_REGEX.exec(contentWithoutCodeBlocks)) !== null) {
    links.push({
      url: match[1],
      type: 'jsx',
      line: contentWithoutCodeBlocks.substring(0, match.index).split('\n').length
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
  const docsJson = loadDocsJson();
  const orphanedPages = findOrphanedPages(filteredFiles, docsJson);

  // Check redirects
  const redirects = extractRedirects(docsJson);
  const redirectIssues = validateRedirects(redirects);

  // Calculate total issues for summary header
  const totalIssues = brokenLinks.length + orphanedPages.length + redirectIssues.length;

  // Print summary header first
  if (totalIssues === 0) {
    console.log('✅ No issues found!\n');
  } else {
    console.log(`❌ Found ${totalIssues} issue(s):\n`);
    console.log(`   • ${brokenLinks.length} broken link(s)`);
    console.log(`   • ${orphanedPages.length} orphaned page(s)`);
    console.log(`   • ${redirectIssues.length} invalid redirect(s)\n`);
  }

  // Display broken links details
  if (brokenLinks.length > 0) {
    console.log('─'.repeat(40));
    console.log('BROKEN LINKS:\n');
    brokenLinks.forEach(({ file, url, line }) => {
      console.log(`   📄 ${file}:${line}`);
      console.log(`      ${url}\n`);
    });
  }

  // Display orphaned pages details
  if (orphanedPages.length > 0) {
    console.log('─'.repeat(40));
    console.log('ORPHANED PAGES (not in docs.json):\n');
    orphanedPages.forEach(page => {
      console.log(`   📄 ${page}.mdx`);
    });
    console.log('');
  }

  // Display redirect issues details
  if (redirectIssues.length > 0) {
    console.log('─'.repeat(40));
    console.log('INVALID REDIRECTS:\n');
    redirectIssues.forEach(({ source, destination, issue }) => {
      console.log(`   🔀 ${source} → ${destination}`);
      console.log(`      ${issue}\n`);
    });
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

  // Exit with error if issues found
  process.exit(totalIssues > 0 ? 1 : 0);
}

main();
