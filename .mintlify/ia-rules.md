# Docs information-architecture rules

Rules for maintaining the Lightdash docs site. The principles bind every change; the two profiles apply them at different scales. This file lives in `.mintlify/`, linked from `AGENTS.md`, so every agent — ours or Mintlify's — works from the same rules.

## Doc types

Every page is plain docs unless it declares otherwise. Three marked types exist, declared in frontmatter with `doc-type`.

**Doc-type pills are suppressed in the sidebar.** A pill earns its place only when it tells a reader something the neighbouring pages don't, and today too many Tutorials are the *only* documentation of their feature rather than a layer on top of it — so the label differentiates nothing, and a cluster of them is actively noisy. Keep declaring `doc-type`: it drives the form contract and the audit, and the pill comes back once Tutorials and Guides are consistently additional resources rather than load-bearing docs.

The `tag` slot therefore carries lifecycle badges only (`Experimental`, `Beta` — GA is the unbadged default; see feature-maturity-levels).

| Type | Declaration | Form contract |
| --- | --- | --- |
| Docs (default) | none | Feature documentation: what it is, how it behaves, its options. Most pages. |
| Tutorial | `doc-type: tutorial` | Walks one task start to finish. Verb-first title and slug: "Set up agents in Slack" → `set-up-slack-agents`. States prerequisites; links to canonical docs instead of re-teaching them. |
| Guide | `doc-type: guide` | Opinionated: how to work The Lightdash Way. Noun-phrase title and slug. |
| Reference | `doc-type: reference` | Exhaustive lookup: schemas, tables, flags. Length is fine; one lookup topic and working anchors are required. |

**Tutorials and Guides layer on top of docs; they never substitute for them.** Every feature earns plain documentation first — what it is, how it behaves, its options. A Tutorial then walks one path through it, and a Guide argues for one way of using it, both linking down to the docs rather than re-teaching them. A Tutorial or Guide that is the only place a feature is documented is load-bearing in a way it should not be: the feature has no reference, and readers who want the full surface have to reverse-engineer it from a walkthrough. When you find one, the fix is to move the feature documentation into its product area and leave the walkthrough pointing at it.

**Guide litmus** — all three should hold: it makes a recommendation someone could reasonably debate; the advice would transfer to another tool or surface and keep its value; remove every step-by-step instruction and something substantial remains. A Guide lives in the area whose practice it shapes — a guide to running agents in Slack as a team lives in `agents/`, because agentic teamwork is what it has opinions about; the Slack setup steps are links or snippets from the Tutorial. The phrase "best practices" never appears in titles or slugs; that content is a Guide with a real name.

**Quickstart is a singleton; Getting Started is a place, not a pattern.** Exactly one page is called Quickstart: `get-started/quickstart`, the golden-path initial setup — detailed install and connection paths sit below it and are linked, not inlined. Getting Started is the `get-started/` area itself: the quickstart plus exactly two persona tracks, `explore-your-data` (explorer) and `build-your-semantic-layer` (developer). Admin gets no track — the `workspace-admin` landing is its on-ramp. Nothing else uses either word: a per-feature "quickstart" is a Tutorial with a verb-first name, and `<area>/getting-started` pages never exist — area landings link to the relevant track instead.

## Principles

1. **One home per fact.** Every fact, schema, table, command, and number has exactly one canonical page. Everywhere else links to it or transcludes it. The moment you find yourself copying a sentence between pages, stop: link, or extract a snippet.
2. **Directories are product areas, never doc types.** `get-started`, `explore`, `semantic-layer`, `workflow` (including `workflow/cli`), `agents`, `data-apps`, `embed`, `integrations`, `workspace-admin`, `personal-settings`, `self-host`, `api-reference`, `support`. Place a page by which part of the product it serves. `workflow/` is the software lifecycle around your Lightdash project — version control, preview environments, CI/CD, content-as-code, the CLI, editor and agent tooling — and nothing else. Never create a directory named for a content type; that taxonomy collapsed once already.
3. **One page, one job.** Declare the page's type (see Doc types). When a page accumulates a second job — a Tutorial growing schema tables, docs growing a walkthrough — split along the type boundary.
4. **Pairs mirror by link, not by copy.** In a paired walkthrough and reference (the embedding docs are the model), the walkthrough owns the journey and one worked example; the reference owns the exhaustive schema. Each links to the other; neither restates the other.
5. **Identical text in two-plus pages is a snippet.** Shared tables, warnings, config blocks, and env-var sections live in `snippets/` and are transcluded. Copies drift — this repo has shipped contradictory versions, sizing numbers, and semantics because of copied tables.
6. **Names are one contract.** Slug ≈ title ≈ sidebarTitle. The sidebar label may shorten the title, never diverge from it. A feature has one name everywhere it's mentioned.
7. **Every URL change ships its redirect in the same PR — but only for URLs that shipped.** Add the entry to `docs.json` `redirects`, re-point any existing redirect whose destination you moved (redirects must never chain), and update all internal links to the final URL — internal links never route through redirects. A slug that only ever existed on an unmerged branch was never public, so nothing links to it and it earns no redirect: re-point the existing entry to the final URL instead of adding a hop through a slug no reader ever saw. Long-running restructures accumulate this junk fast. To check, ask whether the slug exists in `origin/main` or in the branch point's tree; if neither, it never shipped.
8. **Tutorials teach a journey once and link forward.** A step already taught earlier in the same journey is linked, not repeated; a feature walked through in passing links to its canonical doc rather than re-teaching it.
9. **No shipped scaffolding.** No TODO comments, draft markers, review tags, or "Coming soon" pages. Content that isn't ready isn't in the nav.
10. **Merge stubs; review giants.** Under ~150 words: merge into an existing page as a section, with a redirect (honest index pages exempt). Over ~3,000 words: trigger a size review (References often pass; Tutorials and Guides almost never do).
11. **One nav position per page.** A page that serves two audiences gets one nav home; the other surface links to it from its landing page.
12. **Areas land on a root page; sections do not.** The distinction is the URL, and it decides everything else.
    - An **area** is a product concept that owns a directory: `agents/`, `explore/dashboards/`, `semantic-layer/pre-aggregates/`. Its pages live *under* it. It sets `root` (the bare slug) and `directory: "card"`, which renders its children automatically. The landing page is a short orientation plus that auto-rendered directory. **Never re-list a node's own children by hand** — not as a `<CardGroup>`, not as a "Related resources" section, not as a bullet list of links. The nav already renders them, so a hand-built copy shows the same pages twice and goes stale the moment one is added, renamed, or removed. Link a child inline when the prose has a reason to; never enumerate them. An area can nest inside another area.
    - A **section** is nav-only grouping *inside* an area, collecting pages that already live at that area's level — `Build charts` gathering `explore/configure-charts` and its peers. It sets neither `root` nor `directory`; the group label is the whole affordance, and Mintlify renders it as a collapsible header rather than a destination. Sections are folders, not places.

Never force a root onto a section: an orientation page written to satisfy the rule rather than a reader is filler. If a would-be area cannot sustain a meaningful landing page, it is too thin — merge it up. Name a root page's `sidebarTitle` for what the page covers, or omit it; "Overview" is not a sidebar item anywhere. A node over ~12 children triggers a sectional review.
13. **Section large groups; sectioning is free.** Mintlify derives a page's URL from its file path, so regrouping the nav ships no redirects and breaks no links. Group by what a reader is trying to do. A list stays flat when its items are genuine peers — a chart-type gallery is flat because sectioning it would invent a taxonomy readers don't have.
14. **Long pages carry their own anchor index.** A page with sections a reader arrives wanting to jump to — a connection page covering ten warehouses, a reference covering four subsystems — names those sections as inline anchor links near the top. This is the one thing `directory: "card"` cannot do for you: it renders *child pages*, never same-page anchors. Write the index as prose with inline links, not as a grid or a bare bullet list.

## Placement

The question is always **which part of the product does this serve**, never what kind of doc it is. Doc type is a property of the page; the area is where it lives. Most placements are obvious from the directory list in principle 2. The tests below settle the ones that aren't.

### The IA map

Every area and section carries a placement annotation: what it is **for**, and where a boundary is
contested, what it is **not** for and where that goes instead. Read the map as a walkable tree:

```bash
node scripts/ia-map.js
```

The tree itself is derived from `docs.json` at read time, so it cannot drift from the real structure.
Only the annotations are hand-maintained, in `.mintlify/ia-map.yml`.

**Update the annotations when you change the tree** — adding, renaming, moving, or dissolving an area
or section. Adding a page does not touch them. `node scripts/ia-map.js --check` reports both failure
modes and exits non-zero: a node with no annotation, and an annotation whose node no longer exists.

If you cannot write a one-line `for:` that distinguishes a new node from its siblings, it should not
be a node.

### When two areas both fit

Place by what the reader is doing, not by which feature the prose happens to mention. A page about querying that mentions dbt is still `explore/`.

If both areas genuinely need the fact, that is principle 1, not a placement problem: pick the canonical home and have the other area link to it in a sentence.

If the page teaches two different interfaces, that is a split, not a placement decision. Filtering in the Explore view and filtering a dashboard share a word and nothing else; each belongs to its own surface, with shared behaviour in a reference both link to.

### A topic with no home yet

1. **Search first.** Extending the canonical page beats adding one. A new page is the last resort,
not the default.
2. **Name the reader's task**, then apply the boundary tests. If you cannot say which part of the
product it serves, the content is not ready to file.
3. **Check the size.** Under ~150 words it is a section of an existing page, not a page.
4. **Do not invent an area.** A new top-level area needs enough substance for a landing page and
several children; anything less belongs inside an existing one. Sections are free (principle 13) — new areas are not.
5. **Ship it whole:** doc type declared, frontmatter complete, nav entry added, redirect if anything
moved.

## Patch profile — any agent making a docs change

- **Search before writing.** Local agents: `qmd query` against the docs index when available, else `rg`. The Mintlify agent: site search. Default to extending the canonical page over adding a page.
- **Place by product area** (principle 2). When it isn't obvious, work the boundary tests under Placement. Add the nav entry in `docs.json` in the same change.
- **Declare the doc type.** Verb-first slug if and only if it's a Tutorial.
- **Write in current state.** The page describes how the product works now — no "new", "recently", "previously", or changelog narration.
- **Restating a fact from another page?** Replace it with a link or snippet before finishing (principles 1, 5).
- **Moving, renaming, or merging anything?** Full principle-7 checklist: redirect + re-point + rewrite inbound links (`rg` the old slug).
- **Before done:** frontmatter has `title` and `description`; the page is reachable from nav; `mint broken-links` passes.

## Cleanup profile — periodic review agents

Start by checking structural integrity: pages not reachable from nav, nav entries with no page, redirect chains, redirect destinations that no longer resolve, internal links that only work via a redirect, and missing frontmatter. Then sweep, in priority order:

1. **Fact drift:** versioned facts (image versions, sizing, env vars, limits) stated in more than one place — reconcile to one canonical home; if the copies *disagree*, escalate to a human with both sources cited rather than guessing which is current.
2. **Duplicated content:** identical blocks → snippet; near-duplicate prose (the `qmd` similarity sweep catches paraphrase drift the hash check can't) → trim the non-canonical copy to a link.
3. **Type drift:** declared type versus actual form — a Tutorial that has grown reference tables, docs that have grown a walkthrough → split per principle 3.
4. **Size reviews:** review pages and sections past the triggers and split where warranted.
5. **Naming drift:** slug/title/sidebarTitle divergence; "best practices" appearing anywhere; two features whose names collide.
6. **Debris:** stubs under the merge threshold, orphaned files, dead snippets, deprecated sections whose replacement is live, scaffolding markers.
7. **Redirect hygiene:** chains, internal links through redirects, redundant entries.

Fix in small per-cluster PRs, each independently reviewable.
