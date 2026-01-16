#!/usr/bin/env node

/**
 * Automatically fixes image location issues by moving images to the correct directory
 * and updating all references in MDX files.
 *
 * This script:
 * - Detects images that are not in the correct directory structure
 * - Moves them to the expected location (mirrors page structure)
 * - Updates all references in MDX files
 * - Creates necessary directories
 * - Handles both absolute and relative image paths
 *
 * Run: node scripts/fix-image-locations.js [--dry-run]
 *
 * Options:
 *   --dry-run    Show what would be changed without making any modifications
 *   --help       Show this help message
 */

const fs = require('fs');
const path = require('path');

// Regex patterns for finding image references
const MARKDOWN_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;
const JSX_IMG_SRC_REGEX = /<img[^>]+src=["']([^"']+)["']/g;
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

  // Remove code blocks to avoid flagging example images in documentation
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
  return path.join('images', withoutExt);
}

function getRelativePath(filePath) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/');
}

function buildImageUsageMap(files) {
  const imageUsageMap = new Map(); // absoluteImagePath -> [{file, imagePath, line}]

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const images = extractImageReferences(content, file);

    for (const image of images) {
      // Resolve to absolute path
      let absoluteImagePath;
      if (image.path.startsWith('/')) {
        absoluteImagePath = path.join(process.cwd(), image.path.substring(1));
      } else {
        absoluteImagePath = path.join(path.dirname(file), image.path);
      }

      // Normalize path
      absoluteImagePath = path.normalize(absoluteImagePath);

      if (!imageUsageMap.has(absoluteImagePath)) {
        imageUsageMap.set(absoluteImagePath, []);
      }
      imageUsageMap.get(absoluteImagePath).push({
        file,
        imagePath: image.path,
        line: image.line,
        type: image.type,
        alt: image.alt
      });
    }
  }

  return imageUsageMap;
}

function isImageInCorrectLocation(imagePath, mdxFilePath) {
  const expectedDir = getExpectedImageDirectory(mdxFilePath);

  // Resolve absolute path for image
  let absoluteImagePath;
  if (imagePath.startsWith('/')) {
    absoluteImagePath = path.join(process.cwd(), imagePath.substring(1));
  } else {
    absoluteImagePath = path.join(path.dirname(mdxFilePath), imagePath);
  }

  // Check if image exists
  if (!fs.existsSync(absoluteImagePath)) {
    return { valid: false, reason: 'missing' };
  }

  // Check extension
  const ext = path.extname(absoluteImagePath).toLowerCase();
  if (!VALID_IMAGE_EXTENSIONS.includes(ext)) {
    return { valid: false, reason: 'invalid-type' };
  }

  // Get actual directory of the image (relative to project root)
  let imageDir;
  if (imagePath.startsWith('/')) {
    imageDir = path.dirname(imagePath.substring(1));
  } else {
    const relativeImagePath = path.relative(process.cwd(), absoluteImagePath);
    imageDir = path.dirname(relativeImagePath);
  }

  // Check if image is in the expected directory or a valid parent directory
  const isInExpectedDir = imageDir === expectedDir;
  const isInParentDir = expectedDir.startsWith(imageDir + path.sep) || expectedDir === imageDir;

  // Special case: logo, favicon, snippets
  const isSpecialFile = imagePath.includes('/logo/') ||
                        imagePath.includes('favicon') ||
                        imagePath.includes('/snippets/');

  if (isInExpectedDir || isSpecialFile) {
    return { valid: true };
  }

  // Check if it's in a valid parent directory (shared images)
  const expectedParts = expectedDir.split(path.sep);
  const imageParts = imageDir.split(path.sep);
  const isValidParent = expectedParts.length > imageParts.length &&
                       expectedParts.slice(0, imageParts.length).join(path.sep) === imageDir;

  if (isValidParent || isInParentDir) {
    return { valid: true, reason: 'parent-dir' };
  }

  return {
    valid: false,
    reason: 'wrong-location',
    expectedDir,
    actualDir: imageDir
  };
}

function determineCorrectLocation(imageAbsolutePath, usages) {
  // If image is only used by one file, move it to that file's directory
  if (usages.length === 1) {
    const expectedDir = getExpectedImageDirectory(usages[0].file);
    const imageName = path.basename(imageAbsolutePath);
    return path.join(process.cwd(), expectedDir, imageName);
  }

  // For shared images, find the common parent directory
  const expectedDirs = usages.map(u => getExpectedImageDirectory(u.file));

  // Find common prefix
  const commonParts = [];
  const allParts = expectedDirs.map(dir => dir.split(path.sep));

  for (let i = 0; i < allParts[0].length; i++) {
    const part = allParts[0][i];
    if (allParts.every(parts => parts[i] === part)) {
      commonParts.push(part);
    } else {
      break;
    }
  }

  const commonDir = commonParts.length > 0 ? commonParts.join(path.sep) : 'images';
  const imageName = path.basename(imageAbsolutePath);
  return path.join(process.cwd(), commonDir, imageName);
}

function updateImageReferences(file, oldPath, newPath, dryRun = false) {
  let content = fs.readFileSync(file, 'utf8');

  // Calculate the new relative path from this file
  const fileDir = path.dirname(file);
  const newRelativePath = path.relative(fileDir, newPath).replace(/\\/g, '/');

  // Replace all occurrences of the old path with the new path
  // Handle both markdown and JSX references
  let updated = false;

  // For relative paths, we need to match the exact path as written
  const oldPathEscaped = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Markdown images: ![alt](oldPath)
  const markdownRegex = new RegExp(`(!\\[[^\\]]*\\]\\()${oldPathEscaped}(\\))`, 'g');
  if (markdownRegex.test(content)) {
    content = content.replace(markdownRegex, `$1${newRelativePath}$2`);
    updated = true;
  }

  // JSX images: <img src="oldPath"
  const jsxRegex = new RegExp(`(<img[^>]+src=["'])${oldPathEscaped}(["'])`, 'g');
  if (jsxRegex.test(content)) {
    content = content.replace(jsxRegex, `$1${newRelativePath}$2`);
    updated = true;
  }

  if (updated && !dryRun) {
    fs.writeFileSync(file, content, 'utf8');
  }

  return { updated, newRelativePath };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const showHelp = args.includes('--help');

  if (showHelp) {
    console.log('Usage: node scripts/fix-image-locations.js [--dry-run]');
    console.log('\nOptions:');
    console.log('  --dry-run    Show what would be changed without making modifications');
    console.log('  --help       Show this help message');
    process.exit(0);
  }

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  console.log('🔧 Fixing image locations in documentation...\n');

  const mdxFiles = findMDXFiles('.');
  const excludedPaths = ['node_modules', '.git', 'snippets', 'CONTRIBUTING.md'];
  const filteredFiles = mdxFiles.filter(file =>
    !excludedPaths.some(excluded => file.includes(excluded))
  );

  // Build map of all image usages
  const imageUsageMap = buildImageUsageMap(filteredFiles);

  const fixes = [];
  const issues = [];

  // Analyze each image
  for (const [absoluteImagePath, usages] of imageUsageMap.entries()) {
    // Check if this image exists
    if (!fs.existsSync(absoluteImagePath)) {
      issues.push({
        type: 'missing',
        image: getRelativePath(absoluteImagePath),
        usages: usages.map(u => `${getRelativePath(u.file)}:${u.line}`)
      });
      continue;
    }

    // Skip special files
    const relativeImagePath = getRelativePath(absoluteImagePath);
    if (relativeImagePath.includes('/logo/') ||
        relativeImagePath.includes('favicon') ||
        relativeImagePath.includes('/snippets/')) {
      continue;
    }

    // Check if image is in the wrong location for ALL usages
    const locationChecks = usages.map(usage =>
      isImageInCorrectLocation(usage.imagePath, usage.file)
    );

    // If all usages say it's in the wrong location, we should move it
    const allWrong = locationChecks.every(check => !check.valid && check.reason === 'wrong-location');

    if (allWrong) {
      const correctLocation = determineCorrectLocation(absoluteImagePath, usages);
      const correctLocationRelative = getRelativePath(correctLocation);

      fixes.push({
        from: relativeImagePath,
        to: correctLocationRelative,
        absoluteFrom: absoluteImagePath,
        absoluteTo: correctLocation,
        usages
      });
    }
  }

  // Report findings
  if (issues.length > 0) {
    console.log(`⚠️  Found ${issues.length} missing image(s):\n`);
    issues.forEach(issue => {
      console.log(`   📄 ${issue.image}`);
      console.log(`      Referenced in: ${issue.usages.join(', ')}\n`);
    });
  }

  if (fixes.length === 0) {
    console.log('✅ No image location fixes needed!\n');
    process.exit(0);
  }

  console.log(`📋 Found ${fixes.length} image(s) to relocate:\n`);

  // Apply fixes
  for (const fix of fixes) {
    console.log(`   📦 ${fix.from}`);
    console.log(`      → ${fix.to}`);
    console.log(`      Used in ${fix.usages.length} file(s)\n`);

    if (!dryRun) {
      // Create target directory if it doesn't exist
      const targetDir = path.dirname(fix.absoluteTo);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`      ✓ Created directory: ${getRelativePath(targetDir)}`);
      }

      // Move the image file
      fs.renameSync(fix.absoluteFrom, fix.absoluteTo);
      console.log(`      ✓ Moved image`);

      // Update all references
      for (const usage of fix.usages) {
        const result = updateImageReferences(usage.file, usage.imagePath, fix.absoluteTo, dryRun);
        if (result.updated) {
          console.log(`      ✓ Updated reference in ${getRelativePath(usage.file)}:${usage.line}`);
        }
      }

      console.log('');
    }
  }

  if (dryRun) {
    console.log('\n💡 Run without --dry-run to apply these changes\n');
  } else {
    console.log(`\n✅ Successfully fixed ${fixes.length} image location(s)!\n`);

    // Check if there are empty directories to clean up
    console.log('💡 You may want to run: git status');
    console.log('   to see the changes and commit them.\n');
  }

  process.exit(0);
}

main();
