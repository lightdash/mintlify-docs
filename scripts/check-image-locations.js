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
const CODE_BLOCK_REGEX = /```[\s\S]*?```/g;

const VALID_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

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

function extractImageReferences(content, filePath) {
  const images = [];

  // Remove code blocks to avoid flagging example images
  const contentWithoutCodeBlocks = removeCodeBlocks(content);

  // Extract markdown images: ![alt](path)
  let match;
  while ((match = MARKDOWN_IMAGE_REGEX.exec(contentWithoutCodeBlocks)) !== null) {
    const imagePath = match[2];
    if (!imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
      images.push({
        alt: match[1],
        path: imagePath,
        type: 'markdown',
        line: contentWithoutCodeBlocks.substring(0, match.index).split('\n').length
      });
    }
  }

  // Extract JSX image src
  while ((match = JSX_IMG_SRC_REGEX.exec(contentWithoutCodeBlocks)) !== null) {
    const imagePath = match[1];
    if (!imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
      images.push({
        path: imagePath,
        type: 'jsx',
        line: contentWithoutCodeBlocks.substring(0, match.index).split('\n').length
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

function validateImageLocation(imagePath, mdxFilePath, isShared = false) {
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

  // Skip location validation for shared images (used by multiple files)
  if (isShared) {
    return issues;
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

function buildSharedImagesMap(files) {
  const imageUsageMap = new Map(); // imagePath -> [files using it]

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const images = extractImageReferences(content, file);

    for (const image of images) {
      const normalizedPath = image.path.startsWith('/')
        ? image.path
        : '/' + path.relative(process.cwd(), path.join(path.dirname(file), image.path)).replace(/\\/g, '/');

      if (!imageUsageMap.has(normalizedPath)) {
        imageUsageMap.set(normalizedPath, []);
      }
      imageUsageMap.get(normalizedPath).push(getRelativePath(file));
    }
  }

  // Return set of images used by 2+ files (shared images)
  const sharedImages = new Set();
  for (const [imagePath, files] of imageUsageMap.entries()) {
    if (files.length >= 2) {
      sharedImages.add(imagePath);
    }
  }

  return { sharedImages, imageUsageMap };
}

async function main() {
  console.log('🖼️  Checking image locations in documentation...\n');

  const mdxFiles = findMDXFiles('.');
  const excludedPaths = ['node_modules', '.git', 'snippets', 'CONTRIBUTING.md'];
  const filteredFiles = mdxFiles.filter(file =>
    !excludedPaths.some(excluded => file.includes(excluded))
  );

  // First pass: identify shared images
  const { sharedImages, imageUsageMap } = buildSharedImagesMap(filteredFiles);

  const allIssues = [];
  let totalImages = 0;
  let missingImages = 0;
  let misplacedImages = 0;
  let invalidTypes = 0;
  let sharedImagesCount = 0;

  // Check images in each file
  for (const file of filteredFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const images = extractImageReferences(content, file);
    const relativePath = getRelativePath(file);

    for (const image of images) {
      totalImages++;

      // Normalize image path for comparison
      const normalizedPath = image.path.startsWith('/')
        ? image.path
        : '/' + path.relative(process.cwd(), path.join(path.dirname(file), image.path)).replace(/\\/g, '/');

      // Skip location validation for shared images
      const isShared = sharedImages.has(normalizedPath);
      if (isShared) {
        sharedImagesCount++;
      }

      const issues = validateImageLocation(image.path, file, isShared);

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

  // Display summary header first
  if (allIssues.length === 0) {
    console.log('✅ No image issues found!\n');
  } else {
    console.log(`❌ Found ${allIssues.length} image issue(s):\n`);
    console.log(`   • ${missingImages} missing image(s)`);
    console.log(`   • ${misplacedImages} misplaced image(s)`);
    console.log(`   • ${invalidTypes} invalid file type(s)\n`);

    // Group by issue type
    const missingIssues = allIssues.filter(i => i.type === 'missing');
    const locationIssues = allIssues.filter(i => i.type === 'wrong-location');
    const typeIssues = allIssues.filter(i => i.type === 'invalid-type');

    if (missingIssues.length > 0) {
      console.log('─'.repeat(40));
      console.log('MISSING IMAGES:\n');
      missingIssues.forEach(({ file, line, imagePath }) => {
        console.log(`   📄 ${file}:${line}`);
        console.log(`      ${imagePath}\n`);
      });
    }

    if (locationIssues.length > 0) {
      console.log('─'.repeat(40));
      console.log('MISPLACED IMAGES:\n');
      locationIssues.forEach(({ file, line, imagePath, expectedDir, actualDir }) => {
        console.log(`   📄 ${file}:${line}`);
        console.log(`      ${imagePath}`);
        console.log(`      Expected: ${expectedDir}/`);
        console.log(`      Actual: ${actualDir}/\n`);
      });
    }

    if (typeIssues.length > 0) {
      console.log('─'.repeat(40));
      console.log('INVALID FILE TYPES:\n');
      typeIssues.forEach(({ file, line, imagePath, message }) => {
        console.log(`   📄 ${file}:${line}`);
        console.log(`      ${imagePath}`);
        console.log(`      ${message}\n`);
      });
    }
  }

  // Exit with error if issues found
  process.exit(allIssues.length > 0 ? 1 : 0);
}

main();
