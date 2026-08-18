# Reorganization review — working notes

Winnie's granular review of the reorganized corpus, synthesized as it comes in. Organized by area
rather than dictation order. Execute from this, then move it to `archive/`.

Status key: **do** = execute in this pass · **defer** = record in the reorg plan's follow-up
section, do not act now · **keep** = reviewed, no change.

## Explore — split by interface, not by feature

**The governing idea for this area.** Explore-view filtering and dashboard filtering share a word but
are different interfaces, and pages that teach both at once cannot sit in either home. Split content
by the surface a reader is looking at. Drill-down and cross-filtering are not peers of dashboards —
they are things you do *to* a dashboard, so they belong beneath it.

That makes `explore-view` and `dashboards` directory nodes with children, not leaf pages, which is
what earns them root status.

### The evidence

`explore/filter-your-data` (3,344 words) divides cleanly along that seam:

| Portion | Lines | Goes to |
| --- | --- | --- |
| General tips — multiple filters, ALL/ANY, multiple values, CSV upload | ~77 | `explore/filters-reference` (interface-agnostic home) |
| Explore view — Filters tab, sidebar, results table, nested filters | ~49 | `explore/explore-view/filter` |
| Dashboard — temporary and saved filters, SQL-runner charts, filter behavior, required filters, empty defaults, overrides, autocomplete | ~293 | `explore/dashboards/filter` |

Dashboard filtering is two-thirds of the page. `explore/date-zoom` is likewise dashboard-only: its
controls "behave like dashboard filters", it has sections on hiding it on a dashboard and on
embedded dashboards.

### Target shape

```text
explore/
  explore-view.mdx          root   ← use-explores
    filter.mdx                     ← Explore-view portion of filter-your-data
  dashboards.mdx            root   ← build-a-dashboard, with plan-your-dashboard absorbed
    interact.mdx                   ← basic dashboard filtering, drill-downs, cross-filtering;
                                     links out to filter.mdx, date-zoom.mdx, and drill config
    filter.mdx                     ← the in-depth dashboard filtering reference
    date-zoom.mdx                  ← moved from explore/date-zoom
  filters-reference.mdx            ← filter types and operators + the general tips folded in
  search.mdx                       ← from explore-your-content
  share-charts.mdx                 ← from share-insights
```

`interact.mdx` is the orientation page: once you understand what is on a dashboard, this is what you
can do with it. It covers the basics and links to depth rather than restating it.

### Revisions to earlier decisions in this document

The interface split supersedes three things recorded earlier:

1. **`filter-your-data`'s split is no longer deferred.** The interface axis is the principled seam
   the earlier note lacked, and doing it now is what makes the two roots coherent.
2. **`filter-dashboard-by-url` is not merged into `filter-your-data`.** It is dashboard filtering, so
   it lands under `explore/dashboards/` — folded into `filter.mdx`. It still gets no redirect of its
   own (branch-only); its two public sources re-point to the dashboard filtering page.
3. **`drill-into-data` is not a top-level page.** Drill-down and cross-filtering are dashboard-bound;
   they live in `dashboards/interact.mdx`.

`explore/filters-reference` still **keeps** its shape as the shared, interface-agnostic reference —
it only gains the general tips.

## Explore — metrics catalog

**keep.** Resolves the earlier standout question about whether a 3-page subgroup earns sub-directory
status. It does: the content is good, correctly sized, and well structured. It is more documentation
than the feature's usage share warrants, but that costs nothing — the minority who rely on the
feature get good docs, and nobody else pays for it. No change, and not worth prioritizing.

| Page | Words |
| --- | --- |
| `explore/metrics-catalog` (root) | 248 |
| `explore/metrics-catalog/curate-the-catalog` | 3,514 |
| `explore/metrics-catalog/build-saved-trees` | 635 |
| `explore/metrics-catalog/drivers` | 424 |

The group stays a subgroup with its root page. `curate-the-catalog` is past the ~3,000 size trigger;
left alone under the same reasoning — reviewed and accepted, not overlooked.

## Explore — dashboards, and the concept/journey split

The Dashboards subgroup exposed a structural problem that reaches well past dashboards.

**The finding.** The canonical dashboard documentation lives in the Getting Started track, not in
Explore:

| Page | Words | What it is |
| --- | --- | --- |
| `explore/plan-your-dashboard` | 374 | A video embed and three planning questions |
| `get-started/explore-your-data/build-a-dashboard` | 1,656 | Create, add charts, markdown tiles, filters, tabs, hide headers, share |
| `get-started/explore-your-data/interact-with-dashboards` | 652 | The consumer-side behaviour |

So the section reads as "some dashboard pages filed under Explore" rather than a dashboards area with
a page explaining what a dashboard is. That page exists — it is just in the onboarding track.

**Why this blocks the root-page pass.** 25 nav groups currently lack a root page. Writing one for
Dashboards from scratch would restate `build-a-dashboard`, manufacturing a principle-1 violation in
order to satisfy principle 12. The roots are not missing content; the content is misfiled. This work
must therefore land **before** root pages are written, or we write duplicates and delete them.

**It is also already implied by the rules.** `ia-rules` states that Getting Started is a place, not a
pattern, and principle 8 requires a tutorial to link to a canonical doc rather than re-teach it.
Today the track pages *are* the canonical docs.

### The test, applied per page

> Is this the canonical explanation of a concept, or a walkthrough of one journey step?

- **Canonical** → move into the product area, usually becoming that section's root.
- **Journey** → keep in Getting Started, rewritten as step, one worked example, and a link for depth.

Not wholesale. `create-dimensions` and `create-metrics` (~1,300 words each) sit against real
references in `semantic-layer/` and may already be a legitimate tutorial/reference pair — those
likely stay. `intro-metrics-dimensions` is 130 words and probably merges away.

### do — dashboards specifically

1. The Dashboards section root becomes the real feature documentation, sourced from
   `build-a-dashboard`.
2. `interact-with-dashboards` moves alongside it, or merges into it.
3. **Retire `plan-your-dashboard`.** Fold its who/what/how questions into the dashboards landing as a
   short "plan before you build" section; delete the page; re-point its public redirects. It is thin,
   declared `doc-type: tutorial` while teaching no task, and its title and `sidebarTitle` are both
   full sentences that disagree with each other.
4. `build-a-dashboard` stays in the track as a short step that links to the new canonical page.

### Risks to manage

- **Hollow tracks.** Each step must stay followable without bouncing through four links — step, one
  worked example, then a link for depth. Not a link farm.
- **Prose cost.** The moves are cheap; rewriting the tracks into step-plus-link is real writing and
  is the bulk of the effort here.

### Sequenced plan

1. Audit all 14 Getting Started track pages against the concept/journey test.
2. Move the canonical ones into their product areas, as section roots where they fit.
3. Rewrite the remaining track pages as step-plus-link.
4. **Then** the root-page pass for whatever still lacks one.

## Getting Started — redundancy audit

Run first, while the pages are still co-located and the repetition is visible. Three findings.

### 1. The edit → preview → deploy loop is taught three times

| Page | Sections |
| --- | --- |
| `add-tables-to-lightdash` | "Next, preview your changes" · "Last, deploy changes to production" |
| `create-dimensions` | "Preview your changes using `lightdash preview`" · "Deploy your changes to production" (CLI / manual) |
| `create-metrics` | "Preview your changes using `lightdash preview`" · "…deploy it to production" |

Canonical homes already exist and are substantial: `workflow/preview-projects` (2,112 words) and
`workflow/cli/deploy` (564 words). Every track page links to those instead of re-teaching the loop.

### 2. Concept sections are misfiled — the concept/journey test firing

| Section | Belongs in |
| --- | --- |
| `create-dimensions` § "What are dimensions?" | `semantic-layer/dimensions` |
| `create-metrics` § "What are metrics?" | `semantic-layer/metrics` |
| `add-tables-to-lightdash` §§ Configuring which Tables appear · Changing labels and joins · Limiting Tables with dbt tags · Advanced tips | `semantic-layer/tables` |

`add-tables-to-lightdash` is the clearest case: four of its eight sections are Tables configuration
reference, not an onboarding step.

### 3. Heading-as-link antipattern

`create-dimensions` and `create-metrics` each end with an H2 whose entire text is a link to the
reference page. That is navigation wearing a heading's clothes; it pollutes the on-page ToC. Replace
with a normal sentence.

### 4. The explorer track is the sole home for several core BI features

Larger than the developer-track finding. These sections are the *only* canonical documentation of
their feature anywhere in the corpus — verified by searching outside `get-started/`, where the terms
appear only as passing mentions:

| Section | Source page | Canonical home today |
| --- | --- | --- |
| Using the search bar (+ search filters, search groups) | `explore-your-content` | **none** |
| View underlying data | `explore-your-content`, `interact-with-dashboards` | **none** |
| Drill into a metric | `explore-your-content`, `interact-with-dashboards` | **none** |
| Cross-filtering from a chart tile | `interact-with-dashboards` | **none** |
| Share a draft URL · share a saved chart · download results | `share-insights` | **none** |
| Select, filter, sort fields; build and save a chart | `use-explores` | **none** |
| Browsing saved charts and dashboards | `explore-your-content` | partly `explore/spaces` |
| Date zoom | `interact-with-dashboards` | `explore/date-zoom` — **duplicate** |

So moving the explorer track out is not tidying: it creates the missing canonical pages for search,
drilling, cross-filtering, sharing, and the core query flow. Explore currently documents chart
configuration and filters but never explains how to run a query.

### 5. Redundancy *within* the explorer track

- **View underlying data** and **Drill into a metric** are each taught twice, in
  `explore-your-content` and again in `interact-with-dashboards`.
- **Date zoom** in `interact-with-dashboards` duplicates the canonical `explore/date-zoom`; it
  becomes a link.

### 6. `quickstart/connect-project` is a 8,965-word reference inside the quickstart

Declared `doc-type: reference`, titled "Update your project connection" against slug
`connect-project`. Per-warehouse connection reference, not an onboarding step. The reorganization
plan already carries "split into per-warehouse pages" in its Phase 3 backlog; this review confirms
it, and the title/slug divergence goes in the naming pass.

### Consequence: the tracks collapse

Once the concepts and the workflow loop move out, little is left of the three developer-track pages —
which supports collapsing rather than preserving one page per step.

**Settled shape — the existing rule stands.** The quickstart plus exactly two persona tracks:

| Page | Job |
| --- | --- |
| `get-started/quickstart` | Get things wired up and working |
| `get-started/explore-your-data` | Use the tool, basics — links out heavily |
| `get-started/build-your-semantic-layer` | Develop the tool, basics — links out heavily |

Each track collapses toward a single page whose steps link to the canonical pages rather than
re-teaching them.

**No admin track, and the reason is substantive, not incidental:** admins have no common path. Every
admin arrives with different concerns, infrastructure, and setup, so there is no consistent step
sequence to write — unlike business users and developers. Record this rationale in `ia-rules`
alongside the rule, so it is not re-litigated later.

### Order of work

1. **Audit redundancies** while everything is still in Getting Started. *(done — above)*
2. Move topical and concept content to its product area, becoming section roots where it fits.
3. Collapse what remains of Getting Started, linking out to topical pages and workflow guides.
4. Root-page pass — **step one of which is scanning existing content for pages that can serve as
   roots.** Reuse before writing anything new.

## Rules to sharpen in `.mintlify/`

- **Getting Started owns the journey, never the concept.** A track page walks steps and links to the
  canonical page; the canonical explanation of a feature lives in its product area. If a Getting
  Started page is the only place a concept is explained, that concept is misfiled — move it out and
  leave a step behind. This is the rule that would have prevented the drift above.
- Reference length is acceptable when the page carries working internal anchors: Mintlify renders an
  "On this page" table of contents from the headings, so a long reference stays navigable. Deprioritize
  splitting reference-shaped pages on size alone.

## Actions on the reorganization plan itself

**Add a follow-up section at the bottom of `reorg-plan.md`** for pages that are *acceptable as they
are* — they satisfy the structural and DRY criteria — but are not the ideal long-term shape. This is
the durable home for everything marked **defer** in this review, so the intent survives after this
document is archived.

First entry: `explore/filter-your-data`, to be split into four pages.

## Self-host — structural audit

Unlike Explore and Getting Started, **these URLs are public** — the reorganization left self-host paths
largely alone. Folds here ship real redirects rather than re-points.

### Stubs that are pure snippet wrappers

| Page | Words | Content |
| --- | --- | --- |
| `customize-deployment/configure-logging-for-lightdash` | 82 | A note, one sentence, and `<LoggingEnv />` |
| `customize-deployment/configure-smtp-for-lightdash-email-notifications` | 73 | A note, one sentence, and `<SmtpEnv />` |

`environment-variables.mdx` already transcludes both snippets, so neither page holds anything unique.
They exist only to give an env-var section its own URL. **Fold both into `environment-variables` with
redirects.**

The other snippet pairs are legitimate and stay: `headless-browser-env`, `mcp-env`, and
`prometheus-env` sit on companion pages carrying 400–1,900 words of their own.

`recommended-resources` (217 words) folds into `production-deployment-checklist`, where sizing
guidance belongs.

### `customize-deployment` is a nav artifact

By the URL test it is an area — it owns a directory. But the border between "self-hosting" and
"customizing your deployment" is not one a reader can draw, and everything under it is either a
service integration, infrastructure, or licensing. **Dissolve the group in nav, hoisting its sections
to the self-host level.** Files keep their paths, so this ships no redirects.

### Upgrading is a section, not an area

`upgrade-safety` and `upgrade-runbook` are siblings of `upgrading` at `self-host/`, not children of it,
so the URL test makes this a section. Promoting it to an area would mean moving two **public** pages
purely to satisfy nesting — redirects for no reader gain.

### The checklist is a reference, not the landing

`production-deployment-checklist` (1,769 words) is the actionable, sequenced form of what the landing
page renders as a card list — useful and bookmarkable, but a poor first thing to hit. It stays a
reference, linked from the self-host root's prose.

### Proposed shape

```text
Self-host (area, root=self-host)
  lightdash-cloud-vs-self-hosted          choosing between hosting options
  enterprise-on-prem                      concepts
  production-deployment-checklist         reference, linked from the root prose
  environment-variables                   reference
  data-apps
  [Install]               self-host-lightdash · self-host-lightdash-docker-compose
  [Upgrading]             upgrading · upgrade-safety · upgrade-runbook
  [Connect services]      github · slack · google-sheets · mcp
  [Infrastructure]        database · object storage · scheduler · headless browser ·
                          sandboxes · https · prometheus
  [Access and licensing]  license keys · sso-login · organization-roadmap
  NATS workers (area, root=self-host/nats-workers)
```

Eleven children. Sandboxes stays under Infrastructure with `data-apps` cross-linking it, since the
sandbox runtime is infrastructure that data apps consume rather than part of the feature.

## Post-refactor fast-follows

Structural, not content improvement. Separate from the longer-term editorial work.

- **Retire `boost` and `keywords` frontmatter.** Applied without an overall strategy, so they are
  probably not helping and may be actively skewing search.
- **Sweep links to the support page.** Twenty pages link to `/support/feature-maturity-levels` and
  eight to `/support`. Support belongs in a steady UX affordance — footer, help bubble — rather than
  scattered through prose.

## Long-term: tutorials and guides should layer on docs

Captured as a durable rule in `.mintlify/ia-rules.md`, and as a direction of travel rather than
something fully applied by this reorganization.

Everything should have plain documentation of the feature; Tutorials and Guides then add a path
through it or an argument about it, linking down rather than re-teaching. Today several Tutorials and
Guides are load-bearing — they *are* the primary documentation for their feature, which is the same
inversion found in the Getting Started tracks, just distributed across the corpus.

Applying this fully is an undertaking well past this push. The rule is written so new pages land the
right way round, and so the next audit can find the remaining inversions.
