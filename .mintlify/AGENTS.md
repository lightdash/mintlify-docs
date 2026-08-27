# Lightdash docs — agent guide

You are editing the Lightdash documentation. Lightdash is a code-based BI and agentic analytics platform built on a dbt-defined semantic layer: users explore metrics and dimensions, build dashboards, run AI agents over their data, embed analytics, and self-host. Write for the product as it works now.

These rules govern every change. The full system — doc-type contracts and the patch and cleanup profiles — is in [`ia-rules.md`](.mintlify/ia-rules.md). Your job is to follow the rules on each change and leave `mint broken-links` clean.

## Before you write

- **Search first.** Look for an existing home for the content (site search, or `rg` locally). Default to extending the canonical page over adding one.
- **One home per fact.** Every fact, schema, table, command, and number has exactly one canonical page. If you're about to restate something from another page, link to it or transclude a `snippets/` snippet instead — copies drift, and this corpus has shipped contradictory versions because of it.

## Placement and naming

- **Deciding where something goes?** Run `node scripts/docs/render-ia-map.ts` for the annotated area tree, and see Placement in [`ia-rules.md`](.mintlify/ia-rules.md) for edge cases and new topics.
- **Directories are product areas, never doc types:** `get-started`, `explore`, `semantic-layer`, `workflow` (incl. `workflow/cli`), `agents`, `data-apps`, `embed`, `integrations`, `workspace-admin`, `personal-settings`, `self-host`, `api-reference`, `support`. Place a page by which part of the product it serves. Never make a directory named for a content type.
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

## Components

Pick a component by the job it does for the reader, never by how it looks. The full system — callout semantics, lifecycle badges, media, tabs vs code groups, icons, and the colour tokens — is [`components.md`](.mintlify/components.md). The rules you'll hit on almost every change:

- **`<Note>` is the default callout.** `<Info>` is a scope gate (plan, deployment, version) and goes first on the page; `<Warning>` means a real cost for ignoring it. Never two callouts back to back.
- **Lifecycle is a badge, never bold text.** `tag: "Beta"` in frontmatter for a whole page, `<Badge>` for a section. Experimental, Beta, and GA are the only levels.
- **Every image, video, and iframe is wrapped in `<Frame>`**, with a root-relative `/images/…` path and descriptive `alt`.
- **Code-only alternatives are a `<CodeGroup>`;** `<Tabs>` is for alternatives with prose in them. Labels sync across the page on exact match, so use the canonical strings.
- **Icons are Tabler**, set in `docs.json` and in page frontmatter; in prose they only ever mark yes/no cells in a support matrix.
- **Never pick a colour.** Typed components carry their own; hex appears only in mermaid diagrams and two sanctioned custom callouts.

## Moving, renaming, or merging

Ship the redirect in the same change (principle 7):

1. Add the redirect entry to `docs.json` `redirects`.
2. Re-point any existing redirect whose destination you moved — redirects must never chain.
3. Rewrite inbound internal links to the final URL (`rg` the old slug); internal links never route through a redirect.

## Local preview

Start `mint dev --port 3333` **once** in the background and reuse it for the whole session — it hot-reloads `.mdx`, `snippets/`, `styles.css`, and `docs.json`, so never restart it to pick up an edit. If the port is taken, mint silently binds the next port up instead of failing, so relaunching stacks zombie servers. To stop it, kill the background task's PID (the process cmdline is `node .../mint/index.js dev`, so `pkill -f "mint dev"` matches nothing); check for strays with `procs mint`. Launching needs to run outside the sandbox (`mint` writes preview locks under `~/.mintlify`), as does spawning Chrome for screenshots.

## Before done

Frontmatter is complete, the page is reachable from nav, and `mint broken-links` passes. Pages meant to be fetched by URL rather than browsed declare `hidden: true` in frontmatter instead of a nav entry — the validator exempts them from nav reachability, and `seo.indexing: "all"` in `docs.json` keeps them in `llms.txt` and the `.md` export. `start.mdx` (the agent endpoint behind the homepage copy-prompt button) is the one such page; don't add it to nav.

## Reference docs

- [`ia-rules.md`](.mintlify/ia-rules.md) — doc-type contracts, placement, the patch and cleanup profiles
- [`components.md`](.mintlify/components.md) — which component does which job, lifecycle badges, media, icons, colour tokens
- [`component-reference.md`](.mintlify/component-reference.md) — Mintlify's component surface and prop lists
- [`navigation.md`](.mintlify/navigation.md) — docs.json navigation primitives and mapping rules
- [`sidebar-rendering.md`](.mintlify/sidebar-rendering.md) — mint-theme sidebar DOM internals behind the `styles.css` override
- `ia-map.yml` — the area tree `node scripts/docs/render-ia-map.ts` renders

Internal guidance goes here, never in `.mintlify/skills/`. That directory publishes to `docs.lightdash.com/skill.md` for external agents, so it describes Lightdash product capabilities — never how to write these docs.
