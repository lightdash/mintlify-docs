# Lightdash docs — agent guide

You are editing the Lightdash documentation. Lightdash is a code-based BI and agentic analytics platform built on a dbt-defined semantic layer: users explore metrics and dimensions, build dashboards, run AI agents over their data, embed analytics, and self-host. Write for the product as it works now.

These rules govern every change. The full system — doc-type contracts and the patch and cleanup profiles — is in [`ia-rules.md`](.mintlify/ia-rules.md). Your job is to follow the rules on each change and leave `mint broken-links` clean.

## Before you write

- **Search first.** Look for an existing home for the content (site search, or `rg` locally). Default to extending the canonical page over adding one.
- **One home per fact.** Every fact, schema, table, command, and number has exactly one canonical page. If you're about to restate something from another page, link to it or transclude a `snippets/` snippet instead — copies drift, and this corpus has shipped contradictory versions because of it.

## Placement and naming

- **Deciding where something goes?** Run `aube run render:ia-map` for the annotated area tree, and see Placement in [`ia-rules.md`](.mintlify/ia-rules.md) for edge cases and new topics.
- **Directories are product areas, never doc types:** `get-started`, `explore`, `visualizations`, `semantic-layer`, `workflow` (incl. `workflow/cli`), `agents`, `data-apps`, `embed`, `integrations`, `workspace-admin`, `personal-settings`, `self-host`, `api-reference`, `support`. Place a page by which part of the product it serves. Never make a directory named for a content type.
- **One name per feature.** Slug ≈ title ≈ sidebarTitle; the sidebar may shorten the title, never diverge from it. "Best practices" never appears in a title or slug — that content is a Guide with a real name.
- **Add the nav entry in `docs.json` in the same change.** For navigation structure — tabs vs groups, root pages, sidebar rendering and density — read [`navigation.md`](.mintlify/navigation.md).

## Doc types

Every page is plain docs unless it declares otherwise in frontmatter. See `ia-rules.md` for the full form contracts.

- **Tutorial** — `doc-type: tutorial`. Walks one task start to finish; verb-first slug (`set-up-slack-agents`). Links to canonical docs instead of re-teaching them.
- **Guide** — `doc-type: guide`. Opinionated "Lightdash Way" advice; noun-phrase slug.
- **Reference** — `doc-type: reference`. Exhaustive lookup; no pill.

Doc-type pills are suppressed in the sidebar for now, so `tag` carries lifecycle badges only (`Experimental`, `Beta`). Keep declaring `doc-type` — it drives the form contract.

## Writing

- **Current state only.** Describe how the product works now. No "new", "recently", "previously", or changelog narration.
- **Frontmatter** carries `title` and `description` on every page.
- **Fenced code blocks** always declare a language (`text` for output, trees, or ASCII).

## Voice and tone

Write the way the best pages here already read (`explore/dashboards.mdx` is a good model): a knowledgeable colleague explaining the product, not marketing and not a spec.

- **Talk to the reader.** Second person, present tense, active voice: "Set `dbt_selector` in the project settings", not "The selector can be set" or "Users should set".
- **Lead with the job.** Open a page or section with what the reader is trying to do and what they get, then the steps or facts, then the caveats. One or two sentences of orientation, never a preamble.
- **Headings say the task.** Sentence case, and imperative for a task ("Create a dashboard", "Add filters"); a noun phrase for a concept or reference ("Dashboard filters"). No questions, no "Overview".
- **Plain and short.** Everyday words, short sentences, one idea per paragraph. Define a term the first time you use it, or link to where it is defined. No "simply", "just", "easily", "powerful" or "seamless".
- **UI as the reader sees it.** Bold the exact label for buttons, menu items and fields (**New**, **Save**); give a path as **Settings** → **Project** → **dbt selector**. Code, file names, settings keys and commands go in backticks.
- **Exact over vague.** Name the setting, the default, the limit and who can do it (the role or permission). "Admins and editors" beats "users with access".
- **Steps are numbered and one action each.** Say where the reader is before telling them what to click, and show the result when it isn't obvious.
- **Descriptions are one line.** The frontmatter `description` says what the page lets the reader do, in a phrase with no trailing full stop.
- **No promises or prices.** No roadmap, timelines or "coming soon"; no prices or plan costs. Use the shared plan badges in [`components.md`](.mintlify/components.md); reserve `<Info>` for feature-specific enablement requirements.

## Components

Pick a component by the job it does for the reader, never by how it looks. The full system — callout semantics, lifecycle badges, media, tabs vs code groups, icons, and the colour tokens — is [`components.md`](.mintlify/components.md). The rules you'll hit on almost every change:

- **Prose is the default.** Reserve callouts for availability gates, specific risks, surprising exceptions, and optional shortcuts. Follow the variant and density tests in [`components.md`](.mintlify/components.md); never put two callouts back to back, including through snippets.
- **Maturity uses shared linked badges.** Import `FeatureBadge` from `snippets/feature-badge.jsx`; use a matching frontmatter `tag` for a whole page. Keep feature-specific enablement instructions in `<Info>`. See [`components.md`](.mintlify/components.md) for placement and plan-access badges.
- **Every image, video, and iframe is wrapped in `<Frame>`**, with a root-relative `/images/…` path and descriptive `alt`.
- **Code-only alternatives are a `<CodeGroup>`;** `<Tabs>` is for alternatives with prose in them. Labels sync across the page on exact match, so use the canonical strings.
- **Icons are Tabler**, set in `docs.json` and in page frontmatter; in prose they only ever mark yes/no cells in a support matrix.
- **Never pick a colour.** Typed components carry their own; hex appears only in mermaid diagrams and the sanctioned custom callout.

## Moving, renaming, or merging

Treat a reorganization as one change to pages, navigation, redirects, the IA map, and media. Follow the [reorganization checklist](.mintlify/ia-rules.md#reorganization-checklist), including when a section gains or loses a `root` without changing its label.

## Local preview

Start `mint dev --port 3333` **once** in the background and reuse it for the whole session — it hot-reloads `.mdx`, `snippets/`, `styles.css`, and `docs.json`, so never restart it to pick up an edit. If the port is taken, mint silently binds the next port up instead of failing, so relaunching stacks zombie servers. To stop it, kill the background task's PID (the process cmdline is `node .../mint/index.js dev`, so `pkill -f "mint dev"` matches nothing); check for strays with `procs mint`. Launching needs to run outside the sandbox (`mint` writes preview locks under `~/.mintlify`), as does spawning Chrome for screenshots.

## Before done

Use the named tasks in `package.json` instead of invoking their scripts directly. Run from the repository root:

- `aube run validate:docs -- --changed-files <file-list>` checks frontmatter, nav reachability, redirects, internal links, media placement, IA annotations, and blocking component rules. The file list contains one changed path per line, including deleted paths; omit `--changed-files <file-list>` for a full-site audit.
- `aube run audit:components -- --baseline` checks for component regressions across the site.
- `mint validate` checks the Mintlify build and needs to run outside the sandbox because it writes under `~/.mintlify/previews`; `mint broken-links --check-anchors` checks page links and heading anchors. Both need a mint CLI at least as new as the version CI pins in `.github/workflows/validate-docs.yml`. An outdated CLI is missing `mint validate`, ignores `.mintignore`, and reports phantom broken links in `.mintlify/` files and OpenAPI-generated `api-reference` pages — if you see those findings, update with `npm install --global mint@<pinned-version>` instead of editing anything.
- `aube run check` type-checks and tests the utilities when tooling changes.
- `aube run audit:external-links` reports unavailable third-party links when auditing external URLs; findings are advisory.

Mintlify build validation alone does not check the repository's IA annotations or media placement.

### Hidden pages

Pages meant to be fetched by URL rather than browsed declare `hidden: true` in frontmatter instead of a nav entry — the validator exempts them from nav reachability, and `seo.indexing: "all"` in `docs.json` keeps them in `llms.txt` and the `.md` export. `start.mdx` (the agent endpoint behind the homepage copy-prompt button) is the one such page; don't add it to nav.

## Reference docs

- [`ia-rules.md`](.mintlify/ia-rules.md) — doc-type contracts, placement, the patch and cleanup profiles
- [`components.md`](.mintlify/components.md) — which component does which job, lifecycle badges, media, icons, colour tokens
- [`component-reference.md`](.mintlify/component-reference.md) — Mintlify's component surface and prop lists
- [`navigation.md`](.mintlify/navigation.md) — docs.json navigation primitives and mapping rules
- [`sidebar-rendering.md`](.mintlify/sidebar-rendering.md) — mint-theme sidebar DOM internals behind the `styles.css` override
- `ia-map.yml` — the area tree `aube run render:ia-map` renders

Internal guidance goes here, never in `.mintlify/skills/`. That directory publishes to `docs.lightdash.com/skill.md` for external agents, so it describes Lightdash product capabilities — never how to write these docs.
