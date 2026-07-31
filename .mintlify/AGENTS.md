# Lightdash docs — agent guide

You are editing the Lightdash documentation. Lightdash is a code-based BI and agentic analytics platform built on a dbt-defined semantic layer: users explore metrics and dimensions, build dashboards, run AI agents over their data, embed analytics, and self-host. Write for the product as it works now.

These rules govern every change. The full system — doc-type contracts and the patch and cleanup profiles — is in [`ia-rules.md`](./ia-rules.md). A manager agent enforces the rules with a periodic IA audit and owns any approved exceptions in Cloudy; your job is to follow the rules on each change and leave `mint broken-links` clean.

## Before you write

- **Search first.** Look for an existing home for the content (site search, or `rg` locally). Default to extending the canonical page over adding one.
- **One home per fact.** Every fact, schema, table, command, and number has exactly one canonical page. If you're about to restate something from another page, link to it or transclude a `snippets/` snippet instead — copies drift, and this corpus has shipped contradictory versions because of it.

## Placement and naming

- **Directories are product areas, never doc types:** `get-started`, `explore`, `semantic-layer`, `workflow` (incl. `workflow/cli`), `agents`, `data-apps`, `embed`, `integrations`, `workspace-admin`, `personal-settings`, `self-host`, `api-reference`, `help`. Place a page by which part of the product it serves. Never make a directory named for a content type.
- **One name per feature.** Slug ≈ title ≈ sidebarTitle; the sidebar may shorten the title, never diverge from it. "Best practices" never appears in a title or slug — that content is a Guide with a real name.
- **Add the nav entry in `docs.json` in the same change.**

## Doc types

Every page is plain docs unless it declares otherwise in frontmatter. See `ia-rules.md` for the full form contracts.

- **Tutorial** — `doc-type: tutorial` + `tag: Tutorial`. Walks one task start to finish; verb-first slug (`set-up-slack-agents`). Links to canonical docs instead of re-teaching them.
- **Guide** — `doc-type: guide` + `tag: Guide`. Opinionated "Lightdash Way" advice; noun-phrase slug.
- **Reference** — `doc-type: reference`. Exhaustive lookup; no pill.

A lifecycle badge (`Experimental`, `Beta`) outranks the doc-type pill in the `tag` slot; `doc-type` stays declared either way.

## Writing

- **Current state only.** Describe how the product works now. No "new", "recently", "previously", or changelog narration.
- **Frontmatter** carries `title` and `description` on every page.
- **Fenced code blocks** always declare a language (`text` for output, trees, or ASCII).

## Moving, renaming, or merging

Ship the redirect in the same change (principle 7):

1. Add the redirect entry to `docs.json` `redirects`.
2. Re-point any existing redirect whose destination you moved — redirects must never chain.
3. Rewrite inbound internal links to the final URL (`rg` the old slug); internal links never route through a redirect.

## Before done

Frontmatter is complete, the page is reachable from nav, and `mint broken-links` passes.
