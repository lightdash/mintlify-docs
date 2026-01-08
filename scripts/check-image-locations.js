#!/usr/bin/env node

/**
 * Validates that images are placed in the correct directory structure
 * Images should mirror the page structure as defined in CONTRIBUTING.md
 *
 * Rules:
 * - A page at guides/dashboard.mdx should use images from images/guides/dashboard/
 * - Shared images can be in parent folders
 * - All images must exist
 *
 * Run: node scripts/check-image-locations.js
 */

const fs = require('fs');
const path = require('path');

// Regex patterns for finding image references
const MARKDOWN_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;
const JSX_IMG_SRC_REGEX = /<img[^>]+src=["']([^"']+)["']/g;
const FRAME_IMG_REGEX = /<Frame[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/g;

const VALID_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

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

function extractImageReferences(content, filePath) {
  const images = [];

  // Extract markdown images: ![alt](path)
  let match;
  while ((match = MARKDOWN_IMAGE_REGEX.exec(content)) !== null) {
    const imagePath = match[2];
    if (!imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
      images.push({
        alt: match[1],
        path: imagePath,
        type: 'markdown',
        line: content.substring(0, match.index).split('\n').length
      });
    }
  }

  // Extract JSX image src
  while ((match = JSX_IMG_SRC_REGEX.exec(content)) !== null) {
    const imagePath = match[1];
    if (!imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
      images.push({
        path: imagePath,
        type: 'jsx',
        line: content.substring(0, match.index).split('\n').length
      });
    }
  }

  return images;
}

function getExpectedImageDirectory(mdxFilePath) {
  // Get path relative to project root
  const relativePath = path.relative(process.cwd(), mdxFilePath);

  // Remove file extension
  const withoutExt = relativePath.replace(/\.(mdx|md)$/, '');

  // Convert to expected image path
  // e.g., guides/dashboard.mdx -> images/guides/dashboard/
  // e.g., get-started/setup.mdx -> images/get-started/setup/
  return path.join('images', withoutExt);
}

function validateImageLocation(imagePath, mdxFilePath) {
  const issues = [];

  // Resolve absolute path for image
  let absoluteImagePath;
  if (imagePath.startsWith('/')) {
    // Absolute path from project root
    absoluteImagePath = path.join(process.cwd(), imagePath.substring(1));
  } else {
    // Relative path from MDX file
    absoluteImagePath = path.join(path.dirname(mdxFilePath), imagePath);
  }

  // Check if image exists
  if (!fs.existsSync(absoluteImagePath)) {
    issues.push({
      type: 'missing',
      message: 'Image file does not exist',
      imagePath: imagePath,
      absolutePath: absoluteImagePath
    });
    return issues; // No point checking location if file doesn't exist
  }

  // Check if it's actually an image file
  const ext = path.extname(absoluteImagePath).toLowerCase();
  if (!VALID_IMAGE_EXTENSIONS.includes(ext)) {
    issues.push({
      type: 'invalid-type',
      message: `Invalid file extension: ${ext}. Expected: ${VALID_IMAGE_EXTENSIONS.join(', ')}`,
      imagePath: imagePath
    });
  }

  // Get expected directory
  const expectedDir = getExpectedImageDirectory(mdxFilePath);

  // Get actual directory of the image (relative to project root)
  let imageDir;
  if (imagePath.startsWith('/')) {
    imageDir = path.dirname(imagePath.substring(1));
  } else {
    // Convert to absolute then back to relative from project root
    const relativeImagePath = path.relative(process.cwd(), absoluteImagePath);
    imageDir = path.dirname(relativeImagePath);
  }

  // Check if image is in the expected directory or a valid parent directory
  const isInExpectedDir = imageDir === expectedDir;
  const isInParentDir = expectedDir.startsWith(imageDir + path.sep) || expectedDir === imageDir;

  // Special case: logo and favicon can be in root
  const isSpecialFile = imagePath.includes('/logo/') ||
                        imagePath.includes('favicon') ||
                        imagePath.includes('/snippets/');

  if (!isInExpectedDir && !isInParentDir && !isSpecialFile) {
    // Check if it's in a valid parent directory (shared images)
    const expectedParts = expectedDir.split(path.sep);
    const imageParts = imageDir.split(path.sep);

    // Allow if image is in a parent directory of the expected path
    const isValidParent = expectedParts.length > imageParts.length &&
                         expectedParts.slice(0, imageParts.length).join(path.sep) === imageDir;

    if (!isValidParent) {
      issues.push({
        type: 'wrong-location',
        message: 'Image is not in the correct directory',
        imagePath: imagePath,
        expectedDir: expectedDir,
        actualDir: imageDir,
        suggestion: `Move to ${expectedDir}/ or a shared parent directory`
      });
    }
  }

  return issues;
}

function getRelativePath(filePath) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/');
}

async function main() {
  console.log('🖼️  Checking image locations in documentation...\n');

  const mdxFiles = findMDXFiles('.');
  const excludedPaths = ['node_modules', '.git', 'snippets', 'CONTRIBUTING.md'];
  const filteredFiles = mdxFiles.filter(file =>
    !excludedPaths.some(excluded => file.includes(excluded))
  );

  console.log(`📄 Found ${filteredFiles.length} documentation files\n`);

  const allIssues = [];
  let totalImages = 0;
  let missingImages = 0;
  let misplacedImages = 0;
  let invalidTypes = 0;

  // Check images in each file
  for (const file of filteredFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const images = extractImageReferences(content, file);
    const relativePath = getRelativePath(file);

    for (const image of images) {
      totalImages++;

      const issues = validateImageLocation(image.path, file);

      if (issues.length > 0) {
        issues.forEach(issue => {
          allIssues.push({
            file: relativePath,
            line: image.line,
            ...issue
          });

          if (issue.type === 'missing') missingImages++;
          if (issue.type === 'wrong-location') misplacedImages++;
          if (issue.type === 'invalid-type') invalidTypes++;
        });
      }
    }
  }

  // Display results
  if (allIssues.length === 0) {
    console.log('✅ All images are in the correct locations!\n');
  } else {
    console.log(`❌ Found ${allIssues.length} image issues:\n`);

    // Group by issue type
    const missingIssues = allIssues.filter(i => i.type === 'missing');
    const locationIssues = allIssues.filter(i => i.type === 'wrong-location');
    const typeIssues = allIssues.filter(i => i.type === 'invalid-type');

    if (missingIssues.length > 0) {
      console.log(`📁 Missing Images (${missingIssues.length}):\n`);
      missingIssues.forEach(({ file, line, imagePath, message }) => {
        console.log(`   📄 ${file}:${line}`);
        console.log(`      🔗 ${imagePath}`);
        console.log(`      ❌ ${message}\n`);
      });
    }

    if (locationIssues.length > 0) {
      console.log(`📍 Misplaced Images (${locationIssues.length}):\n`);
      locationIssues.forEach(({ file, line, imagePath, expectedDir, actualDir, suggestion }) => {
        console.log(`   📄 ${file}:${line}`);
        console.log(`      🔗 ${imagePath}`);
        console.log(`      ❌ Expected in: ${expectedDir}/`);
        console.log(`      📍 Actually in: ${actualDir}/`);
        console.log(`      💡 ${suggestion}\n`);
      });
    }

    if (typeIssues.length > 0) {
      console.log(`⚠️  Invalid File Types (${typeIssues.length}):\n`);
      typeIssues.forEach(({ file, line, imagePath, message }) => {
        console.log(`   📄 ${file}:${line}`);
        console.log(`      🔗 ${imagePath}`);
        console.log(`      ❌ ${message}\n`);
      });
    }
  }

  // Summary
  console.log('─'.repeat(60));
  console.log(`Total images checked: ${totalImages}`);
  console.log(`Missing images: ${missingImages}`);
  console.log(`Misplaced images: ${misplacedImages}`);
  console.log(`Invalid file types: ${invalidTypes}`);
  console.log('─'.repeat(60));

  console.log('\n💡 Image Placement Rules:');
  console.log('   • Images should mirror page structure');
  console.log('   • guides/dashboard.mdx → images/guides/dashboard/');
  console.log('   • Shared images can be in parent directories');
  console.log('   • See CONTRIBUTING.md for full guidelines\n');

  // Exit with error if issues found
  process.exit(allIssues.length > 0 ? 1 : 0);
}

main();
