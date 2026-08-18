# Docs information-architecture rules

Rules for maintaining the Lightdash docs site. The principles bind every change; the two profiles apply them at different scales. This file lives in `.mintlify/`, linked from `AGENTS.md`, so every agent — ours or Mintlify's — works from the same rules. A manager agent enforces them with the `docs-ia-audit` tool in Cloudy. Approved exceptions live in Cloudy's database and are managed there, never in this repository.

## Doc types

Every page is plain docs unless it declares otherwise. Three marked types exist, declared in frontmatter with `doc-type`; Tutorials and Guides also set `tag`, which renders the sidebar pill. References carry no pill — their titles and tables announce them.

The `tag` slot is also how lifecycle badges render (`Experimental`, `Beta` — GA is the unbadged default; see feature-maturity-levels). A page gets one pill: a lifecycle badge outranks a doc-type pill, and `doc-type` stays declared either way.

| Type | Declaration | Form contract |
| --- | --- | --- |
| Docs (default) | none | Feature documentation: what it is, how it behaves, its options. Most pages. |
| Tutorial | `doc-type: tutorial` + `tag: Tutorial` | Walks one task start to finish. Verb-first title and slug: "Set up agents in Slack" → `set-up-slack-agents`. States prerequisites; links to canonical docs instead of re-teaching them. |
| Guide | `doc-type: guide` + `tag: Guide` | Opinionated: how to work The Lightdash Way. Noun-phrase title and slug. |
| Reference | `doc-type: reference` | Exhaustive lookup: schemas, tables, flags. Length is fine; one lookup topic and working anchors are required. |

**Guide litmus** — all three should hold: it makes a recommendation someone could reasonably debate; the advice would transfer to another tool or surface and keep its value; remove every step-by-step instruction and something substantial remains. A Guide lives in the area whose practice it shapes — a guide to running agents in Slack as a team lives in `agents/`, because agentic teamwork is what it has opinions about; the Slack setup steps are links or snippets from the Tutorial. The phrase "best practices" never appears in titles or slugs; that content is a Guide with a real name.

**Quickstart is a singleton; Getting Started is a place, not a pattern.** Exactly one page is called Quickstart: `get-started/quickstart`, the golden-path initial setup — detailed install and connection paths sit below it and are linked, not inlined. Getting Started is the `get-started/` area itself: the quickstart plus exactly two persona tracks, `explore-your-data` (explorer) and `build-your-semantic-layer` (developer). Admin gets no track — the `workspace-admin` landing is its on-ramp. Nothing else uses either word: a per-feature "quickstart" is a Tutorial with a verb-first name, and `<area>/getting-started` pages never exist — area landings link to the relevant track instead.

## Principles

1. **One home per fact.** Every fact, schema, table, command, and number has exactly one canonical page. Everywhere else links to it or transcludes it. The moment you find yourself copying a sentence between pages, stop: link, or extract a snippet.
2. **Directories are product areas, never doc types.** `get-started`, `explore`, `semantic-layer`, `workflow` (including `workflow/cli`), `agents`, `data-apps`, `embed`, `integrations`, `workspace-admin`, `personal-settings`, `self-host`, `api-reference`, `help`. Place a page by which part of the product it serves. `workflow/` is the software lifecycle around your Lightdash project — version control, preview environments, CI/CD, content-as-code, the CLI, editor and agent tooling — and nothing else. Never create a directory named for a content type; that taxonomy collapsed once already.
3. **One page, one job.** Declare the page's type (see Doc types). When a page accumulates a second job — a Tutorial growing schema tables, docs growing a walkthrough — split along the type boundary.
4. **Pairs mirror by link, not by copy.** In a paired walkthrough and reference (the embedding docs are the model), the walkthrough owns the journey and one worked example; the reference owns the exhaustive schema. Each links to the other; neither restates the other.
5. **Identical text in two-plus pages is a snippet.** Shared tables, warnings, config blocks, and env-var sections live in `snippets/` and are transcluded. Copies drift — this repo has shipped contradictory versions, sizing numbers, and semantics because of copied tables.
6. **Names are one contract.** Slug ≈ title ≈ sidebarTitle. The sidebar label may shorten the title, never diverge from it. A feature has one name everywhere it's mentioned.
7. **Every URL change ships its redirect in the same PR.** Add the entry to `docs.json` `redirects`, re-point any existing redirect whose destination you moved (redirects must never chain), and update all internal links to the final URL — internal links never route through redirects.
8. **Tutorials teach a journey once and link forward.** A step already taught earlier in the same journey is linked, not repeated; a feature walked through in passing links to its canonical doc rather than re-teaching it.
9. **No shipped scaffolding.** No TODO comments, draft markers, review tags, or "Coming soon" pages. Content that isn't ready isn't in the nav.
10. **Merge stubs; review giants.** Under ~150 words: merge into an existing page as a section, with a redirect (honest index pages exempt). Over ~3,000 words: trigger a size review (References often pass; Tutorials and Guides almost never do).
11. **One nav position per page.** A page that serves two audiences gets one nav home; the other surface links to it from its landing page.
12. **Areas land on a root page; sections do not.** The distinction is the URL, and it decides everything else.
    - An **area** is a product concept that owns a directory: `agents/`, `explore/dashboards/`, `semantic-layer/pre-aggregates/`. Its pages live *under* it. It sets `root` (the bare slug) and `directory: "card"`, which renders its children automatically. The landing page is a short orientation plus that auto-rendered directory — **never a hand-built `<CardGroup>`**, which duplicates the listing and drifts the moment a child is added. An area can nest inside another area.
    - A **section** is nav-only grouping *inside* an area, collecting pages that already live at that area's level — `Build charts` gathering `explore/configure-charts` and its peers. It sets neither `root` nor `directory`; the group label is the whole affordance, and Mintlify renders it as a collapsible header rather than a destination. Sections are folders, not places.

    Never force a root onto a section: an orientation page written to satisfy the rule rather than a reader is filler. If a would-be area cannot sustain a meaningful landing page, it is too thin — merge it up. Name a root page's `sidebarTitle` for what the page covers, or omit it; "Overview" is not a sidebar item anywhere. A node over ~12 children triggers a sectional review.
13. **Section large groups; sectioning is free.** Mintlify derives a page's URL from its file path, so regrouping the nav ships no redirects and breaks no links. Group by what a reader is trying to do. A list stays flat when its items are genuine peers — a chart-type gallery is flat because sectioning it would invent a taxonomy readers don't have.
14. **Long pages carry their own anchor index.** A page with sections a reader arrives wanting to jump to — a connection page covering ten warehouses, a reference covering four subsystems — names those sections as inline anchor links near the top. This is the one thing `directory: "card"` cannot do for you: it renders *child pages*, never same-page anchors. Write the index as prose with inline links, not as a grid or a bare bullet list.

## Patch profile — any agent making a docs change

- **Search before writing.** Local agents: `qmd query` against the docs index when available, else `rg`. The Mintlify agent: site search. Default to extending the canonical page over adding a page.
- **Place by product area** (principle 2). Add the nav entry in `docs.json` in the same change.
- **Declare the doc type.** Verb-first slug if and only if it's a Tutorial.
- **Write in current state.** The page describes how the product works now — no "new", "recently", "previously", or changelog narration.
- **Restating a fact from another page?** Replace it with a link or snippet before finishing (principles 1, 5).
- **Moving, renaming, or merging anything?** Full principle-7 checklist: redirect + re-point + rewrite inbound links (`rg` the old slug).
- **Before done:** frontmatter has `title` and `description`; the page is reachable from nav; `mint broken-links` passes.

## Cleanup profile — periodic review agents

Run the `docs-ia-audit` tool first; it reports orphans, nav duplicates, links routed through redirects, stubs, size triggers, type-declaration inconsistencies, and identical code blocks. Then sweep, in priority order:

1. **Fact drift:** versioned facts (image versions, sizing, env vars, limits) stated in more than one place — reconcile to one canonical home; if the copies *disagree*, escalate to a human with both sources cited rather than guessing which is current.
2. **Duplicated content:** identical blocks → snippet; near-duplicate prose (the `qmd` similarity sweep catches paraphrase drift the hash check can't) → trim the non-canonical copy to a link.
3. **Type drift:** declared type versus actual form — a Tutorial that has grown reference tables, docs that have grown a walkthrough → split per principle 3.
4. **Size reviews:** review pages and sections past the triggers and split where warranted. The manager agent records approved departures in Cloudy.
5. **Naming drift:** slug/title/sidebarTitle divergence; "best practices" appearing anywhere; two features whose names collide.
6. **Debris:** stubs under the merge threshold, orphaned files, dead snippets, deprecated sections whose replacement is live, scaffolding markers.
7. **Redirect hygiene:** chains, internal links through redirects, redundant entries.

Fix in small per-cluster PRs, each independently reviewable. Fix every flag returned by the audit; Cloudy's manager agent applies approved exception suppressions.
