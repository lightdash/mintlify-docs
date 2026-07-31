# Lightdash Documentation

Welcome to the Lightdash documentation repository! This repo contains all documentation for [Lightdash](https://www.lightdash.com), built with [Mintlify](https://mintlify.com).

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Familiarity with Markdown/MDX

### Local Development

Install the [Mintlify CLI](https://www.npmjs.com/package/mintlify) to preview documentation changes locally:

```bash
# Install Mintlify CLI
npm i -g mintlify

# Start local development server
mintlify dev
```

### Troubleshooting

- Mintlify dev isn't running - Run `mintlify install` to re-install dependencies
- Page loads as a 404 - Make sure you are running in a folder with `docs.json`

## 📁 Documentation Structure

Directories are product areas, never doc types — a page lives wherever the part of the product it documents lives:

```text
get-started/            # Onboarding: quickstart + explorer/developer tracks
explore/                # Charts, dashboards, spaces, scheduled deliveries
semantic-layer/         # Dimensions, metrics, pre-aggregates
workflow/               # Version control, CI/CD, the CLI (workflow/cli/)
agents/                 # AI analyst agents
data-apps/              # Data apps
embed/                  # Embedding
integrations/           # Third-party integrations
workspace-admin/        # Org, project, and permissions admin
personal-settings/      # Per-user settings
self-host/              # Self-hosting
help/                   # Support
api-reference/          # REST API
sdk/                    # SDKs
snippets/               # Shared content transcluded into multiple pages
```

Whether a page is a Tutorial, Guide, or Reference is a frontmatter property (`doc-type`), not a folder — see [Creating a New Page](#creating-a-new-page) below. The full placement and naming rules live in [`.mintlify/ia-rules.md`](.mintlify/ia-rules.md); check it before creating a new page or directory.

**Images mirror page paths.** `images/` reproduces the same tree as the docs:

1. **Images belong with their pages**: A page at `explore/spaces.mdx` should use images from `images/explore/spaces/`
2. **Shared images go higher**: If an image is used by multiple pages, place it in the nearest common parent folder
3. **Use kebab-case**: All files and folders use `kebab-case` (e.g., `my-new-guide.mdx`, not `my_new_guide.mdx`)

## ✍️ Contributing

Thank you for your interest in improving Lightdash's documentation!

### Creating a New Page

1. **Place it by product area**, not by doc type — pick the directory for the part of the product the page documents (`explore/`, `semantic-layer/`, `workflow/`, `agents/`, and so on; see [Documentation Structure](#-documentation-structure)). Full placement and naming rules are in [`.mintlify/ia-rules.md`](.mintlify/ia-rules.md).

2. **Declare the doc type in frontmatter** if the page isn't a plain docs page:

   | Type | Frontmatter |
   | --- | --- |
   | Docs (default) | none |
   | Tutorial | `doc-type: tutorial` + `tag: "Tutorial"` |
   | Guide | `doc-type: guide` + `tag: "Guide"` |
   | Reference | `doc-type: reference` |

   See `.mintlify/ia-rules.md` for what each type covers and when to use it.

3. **Create the MDX file** with proper frontmatter:

```mdx
---
title: "Your Page Title"
description: "A brief description (under 160 characters for SEO)"
---

# Your Page Title

Introduction paragraph explaining what this page covers.

## Section 1

Content here...
```

4. **Add to navigation** in `docs.json`:

```json
{
  "group": "Your Group Name",
  "pages": [
    "path/to/your-new-page"
  ]
}
```

### Content Best Practices

#### Use Clear, Action-Oriented Titles
- ✅ **Good**: "How to create a dashboard"
- ❌ **Bad**: "Dashboards"

#### Write for Your Audience
- **Docs** (default type): Assume basic familiarity with the feature
- **Tutorials**: Walk a first-timer through one task start to finish
- **Guides**: Opinionated recommendations for readers already familiar with the basics
- **References**: Technical users who need exhaustive detail

#### Structure Your Content
```mdx
# Page Title (H1 - only one per page)

Brief introduction (2-3 sentences)

## What you'll learn (H2)
- Bullet point 1
- Bullet point 2

## Prerequisites (H2)
- Required setup steps
- Links to other docs

## Step-by-step guide (H2)

### Step 1: Do something (H3)
Detailed instructions...

### Step 2: Do next thing (H3)
More instructions...

## Next steps (H2)
- Link to related guides
```

## 🖼️ Image Guidelines

### Adding Images

1. **Create a folder matching your page**:
   ```
   explore/my-new-feature.mdx
   images/explore/my-new-feature/
   ```

2. **Use descriptive filenames**:
   - ✅ **Good**: `create-dashboard-button.png`
   - ❌ **Bad**: `screenshot1.png`, `image.png`

3. **Optimize images**:
   - PNG for screenshots with text
   - JPG for photos
   - WebP for best compression (when supported)
   - Max width: 2000px
   - Compress before committing

4. **Add images in MDX**:

```mdx
<Frame>
  <img src="/images/explore/my-feature/screenshot.png" alt="Descriptive alt text"/>
</Frame>
```

### Image Naming Convention

- Use `kebab-case`: `my-feature-screenshot.png`
- Be descriptive: `dashboard-settings-modal.png` not `modal.png`
- Include state if relevant: `button-hover-state.png`

### Accessibility

Always include meaningful alt text:
```mdx
<img src="/images/path/file.png" alt="Dashboard settings showing the theme selector dropdown menu"/>
```

## 🔁 Using Reusable Snippets

Identical text in two or more pages is a snippet, not a copy — copies drift, and this repo has shipped contradictory sizing numbers and semantics because of copied tables. Shared tables, warnings, and content blocks live in `/snippets/` and are transcluded with an MDX import, not copy-pasted.

### Using an Existing Snippet

Import the snippet and render it where the shared content belongs:

```mdx
import EmbedAvailability from '/snippets/embedding-availability.mdx';

<EmbedAvailability />
```

`snippets/embedding-availability.mdx` (a feature-availability callout) and `snippets/liquid-templating.mdx` (a shared explanation transcluded into both the dimensions and metrics references) are two examples already in use.

### Creating a New Snippet

If you notice the same content repeated across 3+ pages:

1. Create a new file in `/snippets/` with a descriptive name (`embedding-availability.mdx`, not `callout1.mdx`)
2. Import and render it on every page that needs it, replacing the copied text
3. Update the canonical page's content only from then on — every other page stays in sync automatically

## 🔄 Submitting Changes

### 1. Create a Branch

```bash
git checkout -b docs/your-feature-name
```

Branch naming:
- `docs/new-feature-guide` - New documentation
- `docs/fix-typo-in-setup` - Fixes
- `docs/update-api-reference` - Updates

### 2. Make Your Changes

- Edit or create MDX files
- Add images to the correct folders
- Update `docs.json` navigation if needed

### 3. Test Locally

```bash
mintlify dev
```

- Check all links work
- Verify images display correctly
- Review formatting

#### Run Validation Scripts

Before submitting your PR, run these validation scripts to catch common issues:

```bash
# Check for broken internal links and orphaned pages
node scripts/check-links.js

# Check for broken external links (optional, slower)
node scripts/check-links.js --external

# Validate that images are in the correct locations
node scripts/check-image-locations.js
```

**What these scripts check:**

- **check-links.js** - Validates all internal markdown and JSX links, verifies linked files exist, and identifies orphaned pages (not in `docs.json`)
- **check-image-locations.js** - Ensures images mirror page structure (e.g., `explore/dashboard.mdx` → `images/explore/dashboard/`), checks for missing images, and validates file extensions

**Automated checks:** These scripts run automatically on all PRs via GitHub Actions. The validation workflow will comment on your PR with any issues found (but won't block merging).

#### Auto-fixing Image Location Issues

**The bot automatically fixes image location issues!** When you create a PR, the Documentation Bot will:
- Detect misplaced images
- Automatically move them to the correct directory structure
- Update all MDX file references
- Commit the fixes directly to your PR branch

You'll see a comment like: "✅ Fixed 2 misplaced images"

**Manual fixing (optional):**
You can also run the fix script locally:

```bash
# Preview what would be changed
node scripts/fix-image-locations.js --dry-run

# Apply the fixes
node scripts/fix-image-locations.js
```

**Troubleshooting common issues:**

- **Broken links:** Use absolute paths from root (`/explore/spaces` not `../explore/spaces`) and omit file extensions in links
- **Misplaced images:** Run `node scripts/fix-image-locations.js` to automatically fix
- **Shared images:** Can be placed in the nearest common parent directory

### 4. Commit Your Changes

```bash
git add .
git commit -m "docs: add guide for custom metrics"
```

Commit message format:
- `docs: add [feature]` - New content
- `docs: fix [issue]` - Bug fixes
- `docs: update [page]` - Updates
- `docs: remove [deprecated content]` - Removals

### 5. Push and Create PR

```bash
git push origin docs/your-feature-name
```

Then create a Pull Request with:
- Clear title describing the change
- Description of what changed and why
- Screenshots if relevant
- Link to related issues

## 📝 Style Guide

### Voice and Tone

- **Friendly and approachable**: Write like you're helping a colleague
- **Clear and concise**: Get to the point quickly
- **Active voice**: "Click the button" not "The button should be clicked"
- **Second person**: "You can create a dashboard" not "Users can create dashboards"

### Formatting

#### Code Blocks

Use syntax highlighting:

```sql
SELECT
  user_id,
  COUNT(*) as event_count
FROM events
GROUP BY user_id
```

#### Callouts

```mdx
<Note>
  Helpful tips and additional context
</Note>

<Warning>
  Important warnings about potential issues
</Warning>

<Info>
  Informational callouts
</Info>
```

#### Links

- Use descriptive link text: [create a new dashboard](/get-started/explore-your-data/build-a-dashboard)
- Not: Click [here](/get-started/explore-your-data/build-a-dashboard)

#### Lists

Use numbered lists for sequential steps:
1. First do this
2. Then do this
3. Finally do this

Use bullet points for non-sequential items:
- Feature A
- Feature B
- Feature C

### Common Terms

Maintain consistency:
- **Lightdash** (capital L, not lightdash)
- **dbt** (lowercase, not DBT)
- **dashboard** (lowercase, not Dashboard)
- **metric** (not measure or KPI in docs)
- **dimension** (not attribute or field)

## 🐛 Reporting Issues

Found a problem in the docs?

1. [Check if an issue already exists](https://github.com/lightdash/mintlify-docs/issues)
2. Create a new issue with:
   - Clear title
   - Page URL
   - Description of the problem
   - Suggested fix (if you have one)

## ❓ Questions?

- **Slack**: [#analytics-engineering](https://lightdash.slack.com/archives/C091T9LD2LC) (for team members)
- **GitHub Discussions**: For community questions

## 🚀 Publishing Changes

Changes are automatically deployed to production after pushing to the `main` branch via our GitHub App integration.
