# Contributing to Lightdash Documentation

Thank you for your interest in improving Lightdash's documentation! This guide will help you contribute effectively.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Documentation Structure](#documentation-structure)
- [Writing Guidelines](#writing-guidelines)
- [Image Guidelines](#image-guidelines)
- [Using Reusable Snippets](#using-reusable-snippets)
- [Submitting Changes](#submitting-changes)
- [Style Guide](#style-guide)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Familiarity with Markdown/MDX
- Basic understanding of Lightdash features

### Local Development

```bash
# Clone the repository
git clone https://github.com/lightdash/mintlify-docs.git
cd mintlify-docs

# Install dependencies (if using Mintlify CLI)
npm install -g mintlify

# Start local development server
mintlify dev
```

## 📁 Documentation Structure

Our documentation follows a strict folder structure where **images mirror the page structure**:

```
docs/
├── get-started/          # Onboarding and setup guides
├── guides/               # Feature guides and how-tos
├── references/           # API and feature reference docs
├── dbt-guides/           # dbt-specific guides
└── self-host/            # Self-hosting documentation

images/
├── get-started/          # ✅ Mirrors docs structure
├── guides/
├── references/
└── ...
```

### Key Principles

1. **Images belong with their pages**: A page at `guides/dashboard.mdx` should use images from `images/guides/dashboard/`
2. **Shared images go higher**: If an image is used by multiple pages, place it in the nearest common parent folder
3. **Use kebab-case**: All files and folders use `kebab-case` (e.g., `my-new-guide.mdx`, not `my_new_guide.mdx`)

## ✍️ Writing Guidelines

### Creating a New Page

1. **Choose the right location**:
   - **get-started/**: For new users setting up Lightdash
   - **guides/**: Step-by-step instructions for specific tasks
   - **references/**: Detailed feature documentation and API docs
   - **dbt-guides/**: dbt-specific content

2. **Create the MDX file** with proper frontmatter:

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

3. **Add to navigation** in `docs.json`:

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
- **get-started/**: Assume no prior Lightdash knowledge
- **guides/**: Assume basic familiarity
- **references/**: Technical users who need details

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
   guides/my-new-feature.mdx
   images/guides/my-new-feature/
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
  <img src="/images/guides/my-feature/screenshot.png" alt="Descriptive alt text"/>
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

To maintain consistency across the documentation, we use reusable snippets for common callouts and content blocks.

### Available Snippets

#### Feature Availability Callouts

Use these to indicate which plans or deployment types support a feature:

```mdx
<!-- Enterprise-only features -->
<Snippet file="snippets/callouts/enterprise-only.mdx" />

<!-- Cloud-only features -->
<Snippet file="snippets/callouts/cloud-only.mdx" />

<!-- Self-hosted only features -->
<Snippet file="snippets/callouts/self-hosted-only.mdx" />
```

#### Permission & Access Callouts

```mdx
<!-- Requires admin permissions -->
<Snippet file="snippets/callouts/admin-only.mdx" />

<!-- Beta features -->
<Snippet file="snippets/callouts/beta-feature.mdx" />
```

#### Common Setup Sections

```mdx
<!-- dbt prerequisites (includes heading) -->
<Snippet file="snippets/setup/dbt-project-required.mdx" />

<!-- Support channels (includes heading) -->
<Snippet file="snippets/common/support-channels.mdx" />
```

### When to Use Snippets

- ✅ **Use snippets** for standard callouts that appear across multiple pages
- ✅ **Use snippets** for repeated setup instructions or prerequisites
- ❌ **Don't use snippets** for page-specific content that won't be reused

### Creating New Snippets

If you notice the same content repeated across 3+ pages:

1. Create a new snippet file in `/snippets/` with an appropriate subdirectory
2. Use descriptive filenames: `enterprise-only.mdx` not `callout1.mdx`
3. Document the new snippet in this section
4. Update existing pages to use the snippet

**Example snippet file** (`snippets/callouts/my-callout.mdx`):
```mdx
<Note>
  Your reusable content here. Can include [links](/path) and **formatting**.
</Note>
```

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

- Use descriptive link text: [create a new dashboard](/get-started/exploring-data/dashboards)
- Not: Click [here](/get-started/exploring-data/dashboards)

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
