# Cluster: explore / charts / filters

## Summary

Four of the six `main` commits touching this area are small, surgical, and land cleanly on the
refactor's destinations: a SQL-runner chart-type list, a feature-flag note removal, a date-filter
operator rename (`in the period-to-date` → `in all periods to date`, plus a new table row), and a
data-app callout on the scheduled-deliveries page. The fifth, `d712b84`, fixes a typo in a sentence
the refactor deleted outright — a justified `drop`.

The one substantial item is `1312cf1`. `main` renamed the feature "data app visualizations" →
"project chart types", moved it out of `data-apps/` into the Custom charts reference, rewrote the
builder prose (version chips became a **History** side panel), replaced the outdated Vega dropdown
screenshot, and added eight new light/dark screenshots. The refactor independently moved
`references/chart-types/custom-charts.mdx` → `explore/chart-types/custom-charts.mdx` but kept the
old ~1,090-line Vega-only content **and** kept the standalone page alive at
`data-apps/create-visualizations.mdx`. That is the genuine conflict: `main` deleted the page the
refactor preserved and renamed the feature the refactor still calls by its old name in four files.
Adopting `main` means deleting `data-apps/create-visualizations.mdx`, re-pointing its redirect, and
sweeping the old vocabulary out of `data-apps.mdx`, `workflow/cli/reference.mdx`, and
`explore/chart-types.mdx` — so it needs coordination with cluster-dataapps and the CLI/workflow
owner.

## Mapping

| # | Net change | Source | Destination | Action | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Lists the five chart types the SQL runner supports (Table, Bar, Line, Pie, Big number) | `ac7d65b` `guides/developer/sql-runner.mdx` | `explore/sql-runner.mdx` — new `### Chart types` between line 68 and `## Limitations` (line 70) | `port` | Verbatim. It is the only content delta between `origin/main:guides/developer/sql-runner.mdx` and the branch page; everything else in that diff is refactor link/image rewrites. Nothing else on the branch states this list, so no duplication. |
| 2 | Drops the `dashboard-filter-requirements` feature-flag gate — the feature is GA | `a91e78f` `guides/limiting-data-using-filters.mdx` | `explore/filter-your-data.mdx` lines 308–310 (the `<Info>` block under `### Required filters and filter requirement groups`) | `port` | **Removal not yet applied.** The branch still carries the stale note verbatim, including the `LIGHTDASH_ENABLE_FEATURE_FLAGS=...` self-host instruction. Sole remaining occurrence of `dashboard-filter-requirements` in the corpus — `rg` confirms nothing else references the flag. |
| 3 | Documents the `in all periods to date` date-filter operator | `b724975` `guides/filters.mdx` | `explore/filters-reference.mdx` § Date filters — new table row after line 57 (`not in the current`) | `port` | Row goes between `not in the current` and `is before`, matching `main`'s position. This row is the *only* content difference between `origin/main:guides/filters.mdx` and the branch page (the other diff line is the refactor's added `doc-type: reference`). |
| 4 | Corrects the operator label in the filter-requirement rule prose | `b724975` `guides/limiting-data-using-filters.mdx` | `explore/filter-your-data.mdx:373` | `port` | Change `in the period-to-date` → `in all periods to date`. **Full-corpus sweep done**: this is the only stale occurrence of the old label anywhere on the branch (`rg -i "period.to.date"` — the only other hits are `agents/use-ai-agents.mdx:170`, which discusses period-to-date *questions* for the agent's period-over-period tool, an unrelated surface, and CLI/keyboard-shortcut pages matching "in the current directory/explore"). No snippet carries it. |
| 5 | Adds a callout pointing dashboard/chart delivery readers at data-app delivery semantics | `fc84786` `guides/how-to-create-scheduled-deliveries.mdx` | `explore/create-scheduled-deliveries.mdx` § Data & format — `<Info>` after line 74, before `### Message` | `adapt` | Only content delta on this page vs `main`; the rest of the diff is refactor rewrites and the `<DeliveryDestinations />` snippet extraction (`420c967`), which this callout does not touch. Two links must be rewritten: `/guides/data-apps` → `/data-apps`, and `/guides/data-apps/deliveries-and-syncs` → whatever slug cluster-dataapps lands that NEW-ON-MAIN page at. **Blocked on their placement decision.** |
| 6 | Fixes "Slice and eice" → "Slice and dice" | `d712b84` `guides/lightdash-semantic-layer.mdx` | — | `drop` | **Justified:** the refactor replaced that page with a 23-line landing page (`semantic-layer.mdx`, per `move-map.csv:99` — "AI section condenses to link -> agents; bare landing slug"). The entire "what this gives business users" bullet list, including the typo'd sentence, no longer exists. `rg -i "slice and\|eice"` returns zero hits across the branch. Nothing to fix. |
| 7 | Rewrites Custom charts to cover two things — reusable **project chart types** (gallery, builder, field mapping, permissions) and one-off **Vega charts** — and rewrites the Vega quickstart step to the new two-level picker | `1312cf1` `references/chart-types/custom-charts.mdx` | `explore/chart-types/custom-charts.mdx` — new frontmatter `description`, new intro, new `## Project chart types` section before the existing content, existing content demoted under `## Vega charts` with `### Known limitations` / `### Quickstart` | `port` | The branch page is byte-identical to the pre-divergence version plus `doc-type: reference` and image-path rewrites, so `main`'s whole delta applies. Two link rewrites inside the ported text: `/guides/data-apps/self-hosting` → `/data-apps/self-hosting`, `/guides/data-apps/building-locally` → the branch's data-apps-as-code home (`/data-apps#data-apps-as-code`; confirm with cluster-dataapps). `/guides/date-zoom` → `/explore/date-zoom`. Keep `doc-type: reference` and the `icon: "code"`. Page grows to ~1,240 lines — already past the 3,000-word review trigger; see Flags. |
| 8 | Eight new light/dark screenshots for the gallery, builder, picker, and field mapping | `1312cf1` `images/references/chart-types/custom-chart-types-{gallery,builder,picker,mapping}-{light,dark}.png` | `images/explore/chart-types/custom-charts/custom-chart-types-*.png` (same eight basenames) | `port` | Re-home to the branch's nested convention — every existing image for this page lives under `images/explore/chart-types/custom-charts/`, not `images/explore/chart-types/`. `src` attributes in the row-7 text must be updated to match. Classified as `NEW-ON-MAIN (no branch home)`; this is the home. |
| 9 | Replaces the outdated Vega dropdown screenshot with the shipped two-level picker | `1312cf1` `images/references/chart-types/custom-charts-drop-down.png` | `images/explore/chart-types/custom-charts/custom-charts-drop-down.png` | `port` | Byte-level replacement — branch file is 194,625 bytes, `main`'s is 128,443. The branch carries the pre-change image, so the screenshot contradicts row 7's rewritten "Switch to Vega" step until this lands. |
| 10 | Removes the "Data app visualization" chart type from the chart-types index and replaces its explainer paragraph with a one-line description of what Custom charts cover | `1312cf1` `references/chart-types/overview.mdx` | `explore/chart-types.mdx` — delete line 24 bullet, replace line 26 paragraph | `port` | `move-map.csv:131` records `references/chart-types/overview` → `explore/chart-types` (bare landing slug, principle 12), so this is the right home. `main`'s replacement paragraph needs its link repointed: `/references/chart-types/custom-charts` → `/explore/chart-types/custom-charts`. |
| 11 | Retires the standalone "Data app visualizations" page; its content is now the Project chart types section | `1312cf1` (deletes `guides/data-apps/visualizations.mdx`) | `data-apps/create-visualizations.mdx` — delete; `docs.json` nav line 251 — remove; `docs.json` redirect lines 972–973 — re-point to `/explore/chart-types/custom-charts` | `decide` | The branch page is the pre-divergence file with only path fixes and `doc-type: tutorial` added — it carries nothing `main`'s rewrite doesn't supersede, and it still uses the retired "data app visualizations" vocabulary and the eight `visualization-*.png` screenshots `main` deleted. **Recommendation: adopt `main`** — delete the page, re-point the existing redirect (it currently points at `/data-apps/create-visualizations`; re-pointing avoids a chain), and drop `images/data-apps/visualization-*.png`. **Cross-cluster: cluster-dataapps owns the `data-apps/` side of this; I own the destination.** |
| 12 | Renames the feature in prose: "data app visualizations" → "custom chart types" / "declared fields" → "declared inputs" | `1312cf1` `references/lightdash-cli.mdx` | `workflow/cli/reference.mdx:772,938` and `data-apps.mdx:189,283,300` | `adapt` | Follows from row 11 — principle 6, one name per feature. `workflow/cli/reference.mdx` on the branch is an *older* snapshot than `main`'s `references/lightdash-cli.mdx` (branch says "app UUIDs", `main` says "a slug, UUID, or app URL"), so the CLI owner has a larger delta to reconcile; this rename should ride along with it rather than be applied in isolation. **Hand off to the workflow/CLI cluster and cluster-dataapps.** |

## Flags

1. **Row 11 is the only real conflict and needs Winnie's call.** `main` deliberately retired a page
   the refactor kept and renamed the feature it documents. Everything downstream (rows 10, 12, the
   redirect, three files' worth of vocabulary) hangs off that decision. My recommendation is to adopt
   `main` — the rewrite is newer than the refactor's snapshot, and it matches what shipped (the
   builder's version chips became a History panel). But it touches three clusters, so it should land
   as one coordinated change, not piecemeal.

2. **Row 5 is blocked on cluster-dataapps.** The callout links to `deliveries-and-syncs`, which is
   `NEW-ON-MAIN` with no branch home yet. Don't land row 5 until that slug is fixed, or it ships a
   broken link.

3. **`explore/chart-types/custom-charts.mdx` will be ~1,240 lines after row 7** — well past
   principle 10's size-review trigger. It is a Reference, which the rule says usually passes, but the
   page now does two jobs (a feature doc for project chart types, and a Vega template cookbook). Worth
   considering a split: `explore/chart-types/custom-charts.mdx` for the feature, with the Vega
   template gallery as its own page or accordion set. Not a blocker; flagging for the audit.

4. **Refactor-side debris in my area** (pre-existing, not introduced by `main`, cheap to fix on the
   way in):
   - `images/references/` still holds 6 orphan files (`chart-types/custom-map-chart.png`,
     `custom-map-usa.png`, `metrics-as-rows-*.jpg`, `workspace/*-space.png`). `rg` finds zero
     references to `images/references` anywhere on the branch.
   - `explore/chart-types.mdx` title is "Chart types overview" — principle 6 (slug ≈ title) and the
     "Overview is not a sidebar item" rule. The group name in `docs.json` is already "Chart types";
     the page title should match. The hand-maintained bullet list of children also sits awkwardly
     with principle 12's "never a hand-built card grid" given `directory: "card"` is set.
   - `explore/chart-types.mdx` lists both "Bar chart" and "Horizontal bar chart" pointing at the same
     URL (`/explore/chart-types/bar-chart`) after the merge recorded at `move-map.csv:127`. One of
     them should go, or the second should be an anchor link to the merged section.
   - `explore/filter-your-data.mdx` frontmatter title is "Using Filters" while the slug is
     `filter-your-data` and it declares `doc-type: tutorial`. Verb-first slug, noun-phrase title —
     principle 6. Title should be "Filter your data".
   - `explore/filters-reference.mdx:9` says "check out our docs on limiting data using filters" with
     no link and the retired page name. Same defect exists on `main`, so it isn't a refactor
     regression, but we're editing three lines below it anyway.
   - `explore/sql-runner.mdx:68` has a "dashbaord" typo, also present on `main`. Free fix while
     adding row 1's section directly beneath it.

5. **Not a conflict, checked anyway:** `sdk/python-sdk.mdx:202` carries its own supported-operators
   matrix that omits `in all periods to date`. That's the Python SDK filter DSL, a different surface
   from the UI operator list, and `main` did not add it there. Leaving it alone — but it is a second
   copy of an operator list, so it belongs in the audit's fact-drift sweep eventually.

## Proposed commits

**`docs(explore): correct filter operator label and drop the shipped feature flag`** — rows 2, 3, 4.
Self-contained, no cross-cluster dependency, no nav or redirect changes. Land this first.

**`docs(explore): list SQL runner chart types`** — row 1. Trivial and independent; can be folded into
the commit above if you'd rather not have a one-line commit, though the scopes are unrelated.

**`docs(explore): document project chart types in the custom charts reference`** — rows 7, 8, 9, 10,
11, 12. This is the coordinated one: content, nine images, the chart-types index, the page deletion,
the redirect re-point, and the vocabulary sweep. Needs the row 11 decision and sign-off from
cluster-dataapps and the CLI/workflow owner before it can land.

Row 5 doesn't have a home yet — it should ride in cluster-dataapps' deliveries-and-syncs commit,
since that's what fixes the slug it links to.
