# Documentation Scripts

This directory contains automation scripts for maintaining the Mintlify documentation repository.

## Available Scripts

### Image Location Management

#### `check-image-locations.js`

Validates that images are placed in the correct directory structure according to our conventions.

**Usage:**
```bash
node scripts/check-image-locations.js
```

**What it checks:**
- Images exist at the referenced paths
- Images are in valid formats (png, jpg, jpeg, gif, svg, webp)
- Images follow the correct directory structure (mirroring page structure)
- Shared images are properly identified and allowed in parent directories

**Rules:**
- A page at `guides/dashboard.mdx` should use images from `images/guides/dashboard/`
- Shared images (used by 2+ files) can be placed in parent directories
- Special directories like `logo/`, `favicon`, and `snippets/` are exempt

**Exit codes:**
- `0` - No issues found
- `1` - Issues found

---

#### `fix-image-locations.js` ⭐ NEW

Automatically fixes image location issues by moving images to the correct directories and updating all references.

**Usage:**
```bash
# Preview what would be changed (recommended first step)
node scripts/fix-image-locations.js --dry-run

# Apply the fixes
node scripts/fix-image-locations.js

# Show help
node scripts/fix-image-locations.js --help
```

**What it does:**
1. Scans all MDX/MD files for image references
2. Identifies images that are not in the correct location
3. Moves images to the expected directory structure
4. Updates all references in MDX files to point to the new locations
5. Creates necessary directories automatically
6. Handles both single-use and shared images intelligently

**Smart behavior:**
- **Single-use images**: Moved to the specific page's directory
- **Shared images**: Moved to the nearest common parent directory
- **Safe operation**: Uses `--dry-run` to preview changes first

**Example output:**
```
📋 Found 3 image(s) to relocate:

   📦 images/old-location/screenshot.png
      → images/guides/feature/screenshot.png
      Used in 1 file(s)

      ✓ Created directory: images/guides/feature
      ✓ Moved image
      ✓ Updated reference in guides/feature.mdx:42

✅ Successfully fixed 3 image location(s)!
```

---

### Link Validation

#### `check-links.js`

Validates that all internal links point to existing files.

**Usage:**
```bash
node scripts/check-links.js
```

---

## GitHub Actions Integration

These scripts are integrated into GitHub Actions workflows:

### Automatic Validation (on every PR)

The `validate-docs.yml` workflow runs automatically on every PR to `main`:
- Checks for broken links
- Validates image locations
- Posts a comment on the PR with results
- Issues are informational and don't block merging

### Automatic Fixing (manual trigger)

The `fix-image-locations.yml` workflow can be triggered manually:

1. Go to **Actions > Fix Image Locations**
2. Click **Run workflow**
3. Enter the PR number (or leave empty for current branch)
4. Click **Run workflow**

The bot will:
- Check for image location issues
- Automatically move images to correct locations
- Update all MDX file references
- Commit and push the changes
- Verify that all issues are resolved
- Comment on the PR with details

**When to use:**
- After using Mintlify Slack app (which may not follow image directory rules)
- When you want to bulk-fix image location issues
- To save time manually moving images and updating references

---

## Typical Workflow

### For Contributors

1. **During development:**
   ```bash
   # Check for issues before committing
   node scripts/check-image-locations.js
   node scripts/check-links.js
   ```

2. **If issues are found:**
   ```bash
   # Preview what will be fixed
   node scripts/fix-image-locations.js --dry-run

   # Apply fixes
   node scripts/fix-image-locations.js

   # Commit the changes
   git add -A
   git commit -m "fix: Move images to correct locations"
   ```

3. **Create PR:**
   - GitHub Actions will automatically validate
   - If issues remain, the bot will comment with details and auto-fix instructions

### For Maintainers

When a PR has image location issues:

**Option 1: Ask contributor to fix locally** (preferred for learning)
- Comment on PR asking them to run `node scripts/fix-image-locations.js`

**Option 2: Use the auto-fix bot**
- Go to Actions > Fix Image Locations
- Run workflow with the PR number
- Bot will commit fixes directly to the PR branch

**Option 3: Fix manually**
- Checkout the PR branch
- Run `node scripts/fix-image-locations.js`
- Push the changes

---

## Common Issues and Solutions

### "Image file does not exist"
**Cause:** Reference to an image that hasn't been committed
**Solution:** Add the image file or remove the reference

### "Image is not in the correct directory"
**Cause:** Image is in the wrong folder
**Solution:** Run `fix-image-locations.js` to auto-fix

### "Invalid file extension"
**Cause:** Referencing a non-image file
**Solution:** Convert to a valid format or update reference

### "No changes were made after auto-fix"
**Cause:** Issues are missing images or invalid types (not just wrong location)
**Solution:** Manually add missing images or fix file types

---

## Contributing

When adding new validation or fix scripts:
1. Add them to this directory
2. Update this README with documentation
3. Consider integrating into GitHub Actions
4. Add appropriate error handling and user-friendly output
5. Support `--dry-run` for destructive operations
