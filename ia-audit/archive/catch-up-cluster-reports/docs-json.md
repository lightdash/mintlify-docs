# Cluster: docs.json reconciliation

## Summary

`main` touched only two keys in `docs.json`: `navigation` and `redirects`. No theme, colors, fonts, footer, navbar, logo, api, appearance, or `$schema` change — verified key-by-key against `fec6bf3`, so there is nothing hidden to lose outside nav and redirects. The net delta is **8 nav additions (all genuinely new pages, none moves), 2 nav removals, and 2 redirect additions**.

Both of `main`'s redirect additions are already satisfied on the branch and **must not be ported verbatim — each would create a two-hop chain**. The real work runs the other direction: `main` shipped 8 new public URLs between 2026-07-29 and 2026-08-13 that the branch's tree does not serve and does not redirect. Six of them need new redirect entries that do not exist on the branch today (two need none because their path is unchanged). Separately, the audit turned up one **refactor drift bug**: `move-map.csv` line 200 promises a redirect for `self-host/customize-deployment/enable-scheduler-in-self-hosted-lightdash` that was never written into `docs.json`, so a base-era live URL 404s on the branch.

One genuine editorial conflict: `main` commit 1312cf1 ("move custom chart types out of data apps") deliberately moved the project-chart-types feature *out* of data apps and into the chart-types reference — the branch made the opposite call and kept it at `data-apps/create-visualizations`.

Otherwise the branch's `docs.json` is internally consistent: 212 nav entries, 0 dangling, 0 duplicates, 226 `.mdx` files with 14 orphans that are all `snippets/` (correct — snippets are transcluded, not navigated), 253 redirects with **0 chains** and 0 destinations that aren't real branch pages.

## Mapping

| # | docs.json change on main | Type | Action for the branch | Notes |
| --- | --- | --- | --- | --- |
| 1 | `+ get-started/setup-lightdash/ssh-tunnel` into group **Setting up a new project** (d30b274, 2026-08-10) | nav | `pending` — no cluster owns `get-started`. Mechanical translation is `get-started/quickstart/ssh-tunnel` (the group renamed `setup-lightdash` → `quickstart`), inserted after `get-started/quickstart/connect-project` | New page, 36 lines. **Unowned** — `get-started` is not in the cluster list (agents/self-host/data-apps/semantic-layer/explore/workflow/admin). Needs an owner. Also a shape question: the branch's Quickstart group is a 3-step linear onboarding path; a conditional warehouse-networking page sits awkwardly in it. Alternative is folding it into `get-started/quickstart/connect-project` as a section. **Redirect required** either way (row 12) |
| 2 | `+ guides/data-apps/building-locally` into group **Data apps** (82588be, 2026-08-03) | nav | `pending` — cluster **data-apps**. Lands in the `Data apps` group; suggested path `data-apps/build-locally` | New page, 300 lines. Branch data-apps slugs are verb-first (`create-visualizations`, `customize-themes`); `building-locally` should follow. Declared a "guide" on main → needs `doc-type: guide` + `tag: Guide` and a noun-phrase slug, **or** `doc-type: tutorial` + verb-first — cluster's call. **Redirect required** (row 13) |
| 3 | `+ guides/data-apps/deliveries-and-syncs` into group **Data apps** (fc84786, 2026-08-10) | nav | `pending` — cluster **data-apps**. Suggested path `data-apps/deliveries-and-syncs` (unchanged slug) | New page, 129 lines. Already written one-home-per-fact-correctly: it defers scheduling/recipients to the canonical pages and only documents what is app-specific. Its two outbound links need rewriting (see row 17). **Redirect required** (row 14) |
| 4 | `+ guides/data-apps/maps` into group **Data apps**, replacing the removed `guides/data-apps/visualizations` slot (486ed28, 2026-08-07) | nav | `pending` — cluster **data-apps** | New page, 259 lines. This is a **Tutorial** by the branch's contract (walks one task start to finish) → `doc-type: tutorial` + `tag: Tutorial` + verb-first slug, e.g. `data-apps/build-a-globe-visualization`. Fix an IA violation on the way in: main's `title` ("Building a globe visualization with external connections") and `sidebarTitle` ("Map tutorial") diverge, which breaks one-name-per-feature. **Redirect required** (row 15) |
| 5 | `+ references/pre-aggregates/external-tables` into group **Pre-aggregates**, between `getting-started` and `monitoring` (25c962f, 2026-08-13) | nav | `pending` — cluster **semantic-layer**. Path `semantic-layer/pre-aggregates/external-tables`, same relative position (after `semantic-layer/pre-aggregates/getting-started`) | New page, 211 lines. Cleanest translation of the eight — the whole `references/pre-aggregates/*` group already maps 1:1 onto `semantic-layer/pre-aggregates/*`. Needs `doc-type: reference`. **Redirect required** (row 16) |
| 6 | `+ self-host/customize-deployment/enable-organization-roadmap` into group **Customize deployment** (9da2246, 2026-07-29) | nav | `pending` — cluster **self-host**. **Path is unchanged** on the branch | The only new page whose path survives the refactor untouched → **no redirect needed**. Branch's Customize deployment group is not alphabetised; place it near `enable-headless-browser-for-lightdash`. Carries `boost: 0.001` in frontmatter — preserve it |
| 7 | `+ self-host/upgrade-safety` **and** `+ self-host/upgrade-runbook`, replacing the removed `self-host/upgrading-lightdash-versioning` (8d672e6 + a255754, 2026-08-11/12) | nav | `decide` — cluster **self-host**. Paths unchanged if adopted as-is → **no redirect needed** | 276 + 418 lines, both `tag: "Beta"`. **Overlaps the refactor's merge**: the branch collapsed `update-lightdash` + `upgrading-lightdash-versioning` into `self-host/upgrading` (`## Upgrade mechanics`, `## Database migrations`, `## Rollback`). The runbook's "step-by-step sequences … migration command reference and recovery paths" restates that material. One-home-per-fact forces a call: fold the runbook into `self-host/upgrading`, or keep three pages and thin `upgrading` down to versioning policy. Self-host cluster owns this; it is their decision, not a docs.json one — I only note the nav consequence |
| 8 | `− guides/data-apps/visualizations` from group **Data apps** (1312cf1, 2026-08-12) | nav | `decide` — clusters **data-apps** + **explore** jointly | `main` explicitly ruled this feature is mis-filed under data apps and folded it into `references/chart-types/custom-charts` as a new `## Project chart types` section (lines 14–125), growing that page 1089 → 1212 lines and adding 8 `images/references/chart-types/custom-chart-types-*` files. The branch made the **opposite** call: kept it as `data-apps/create-visualizations.mdx` (116 lines, `doc-type: tutorial`) and left `explore/chart-types/custom-charts.mdx` as pure Vega reference. **Recommendation: follow `main`.** It is the later, deliberate editorial judgment, and it matches the branch's own "directories are product areas" logic — project chart types are a charting feature, not a data-apps feature. Merging a tutorial into a reference page is the friction; main's version reads as reference-with-procedure, which is acceptable in a Reference. If adopted, row 10 changes and `/data-apps/create-visualizations` needs **no** redirect (it has never been public — it exists only on this branch) |
| 9 | `− self-host/upgrading-lightdash-versioning` from group **Self-host** (8d672e6) | nav | `drop` — already done | The branch removed this page in the same merge (move-map.csv:217) and already redirects it. No action |
| 10 | `+ redirect /guides/data-apps/visualizations → /references/chart-types/custom-charts` (1312cf1) | redirect | `adapt` — **do not port verbatim, it chains** | Branch already maps this source → `/data-apps/create-visualizations`, and separately maps `/references/chart-types/custom-charts` → `/explore/chart-types/custom-charts`. Porting main's destination literally produces `visualizations → references/chart-types/custom-charts → explore/chart-types/custom-charts`, a 2-hop chain. If row 8 adopts main's decision, **re-point the existing branch entry to `/explore/chart-types/custom-charts`** (final URL, one hop). If row 8 keeps the branch's structure, leave the branch entry as-is and drop main's |
| 11 | `+ redirect /self-host/upgrading-lightdash-versioning → /self-host/update-lightdash` (8d672e6) | redirect | `drop` — already correct, and porting would chain | Branch already maps this source → `/self-host/upgrading`, which is the **final** destination. Main's destination `/self-host/update-lightdash` is itself a branch redirect source (→ `/self-host/upgrading`), so porting main's entry creates a 2-hop chain. The branch's existing entry is strictly better. Justified drop: the refactor reached the same endpoint by a shorter path |
| 12 | *(reverse direction)* `/get-started/setup-lightdash/ssh-tunnel` is live on main; branch would 404 | redirect | `new` — **add**, destination = row 1's outcome | Blocked on row 1's placement decision |
| 13 | *(reverse)* `/guides/data-apps/building-locally` live; branch would 404 | redirect | `new` — **add** → `/data-apps/build-locally` | Blocked on row 2's slug |
| 14 | *(reverse)* `/guides/data-apps/deliveries-and-syncs` live; branch would 404 | redirect | `new` — **add** → `/data-apps/deliveries-and-syncs` | Straightforward |
| 15 | *(reverse)* `/guides/data-apps/maps` live; branch would 404 | redirect | `new` — **add** → `/data-apps/<row 4 slug>` | Blocked on row 4's slug |
| 16 | *(reverse)* `/references/pre-aggregates/external-tables` live; branch would 404 | redirect | `new` — **add** → `/semantic-layer/pre-aggregates/external-tables` | Straightforward; matches the 4 sibling redirects already on the branch |
| 17 | Internal links inside main's 8 new pages | other | `adapt` — rewrite 18 distinct link targets to their final branch URLs when porting | Every one resolves through the branch's redirect set, so nothing is genuinely broken — but IA principle 7 says internal links never route through a redirect. Full list in **Link rewrites** below. Highest-frequency: `/references/workspace/feature-maturity-levels` → `/help/feature-maturity-levels` (3 pages), `/references/lightdash-cli` → `/workflow/cli/reference`, `/guides/data-apps*` → `/data-apps*` |
| 18 | *(branch bug, not a main change)* `/self-host/customize-deployment/enable-scheduler-in-self-hosted-lightdash` 404s on the branch | redirect | `new` — **add** → `/self-host/customize-deployment/scheduler` | **Refactor drift.** `move-map.csv:200` classifies this page `delete` with the note "redirect to scheduler", but the entry was never written into `docs.json`. It is the *only* base-era nav URL the branch neither serves nor redirects. Independent of every other row — shippable immediately |
| 19 | `ia-audit/redirects-draft.json` | other | `drop` — fully superseded | Verified absorbed: 188 `new_redirects` + 62 `updated_existing_redirects` = 250, all present in `docs.json` with **identical destinations, zero divergence**. Base had 65 redirects, 62 re-pointed + 3 untouched, 65 + 188 = the branch's 253. **Do not add main's new URLs here** — `docs.json` is the single source now. Keep the file frozen as an audit record or delete it, but never treat it as live |
| 20 | `timezones-draft.mdx` | other | `drop` — no action | Unreferenced orphan on `main` (in no nav, linked from nothing). Branch deleted it. No redirect warranted |

## Link rewrites (row 17 detail)

All 18 targets appearing in main's 8 new pages, with the final branch URL. Two "broken" targets (`/self-host/upgrade-safety`, `/self-host/upgrade-runbook`) are just the new pages cross-linking each other and resolve once ported.

| Link in main's new pages | Rewrite to |
| --- | --- |
| `/get-started/setup-lightdash/connect-project` | `/get-started/quickstart/connect-project` |
| `/guides/cli/how-to-install-the-lightdash-cli` | `/workflow/cli/install` |
| `/guides/cli/how-to-upgrade-cli` | `/workflow/cli/install` |
| `/guides/data-apps` | `/data-apps` |
| `/guides/data-apps/external-connections` | `/data-apps/external-connections` |
| `/guides/data-apps/self-hosting` | `/data-apps/self-hosting` |
| `/guides/how-to-create-alerts` | `/explore/create-alerts` |
| `/guides/how-to-create-scheduled-deliveries` | `/explore/create-scheduled-deliveries` |
| `/references/chart-types/custom-charts` | `/explore/chart-types/custom-charts` |
| `/references/chart-types/map` | `/explore/chart-types/map` |
| `/references/integrations/google-sheets` | `/integrations/sync-google-sheets` |
| `/references/lightdash-cli` | `/workflow/cli/reference` |
| `/references/pre-aggregates/cli-audit` | `/semantic-layer/pre-aggregates/audit-with-cli` |
| `/references/pre-aggregates/monitoring` | `/semantic-layer/pre-aggregates/monitoring` |
| `/references/pre-aggregates/overview` | `/semantic-layer/pre-aggregates` |
| `/references/tables` | `/semantic-layer/tables` |
| `/references/workspace/export-limits` | `/workspace-admin/export-limits` |
| `/references/workspace/feature-maturity-levels` | `/help/feature-maturity-levels` |

`/self-host/customize-deployment/enterprise-license-keys` and `/self-host/production-deployment-checklist` already resolve on the branch — leave them.

## Branch docs.json health check

Scripted, not eyeballed (`scratchpad/check_docsjson.py`, `check2.py`):

| Check | Result |
| --- | --- |
| Nav entries pointing at a nonexistent `.mdx` | **0** |
| Nav entries listed more than once | **0** |
| `.mdx` files not reachable from nav | 14, **all `snippets/`** — correct by design |
| Redirect chains (a destination that is itself a source) | **0** |
| Redirect destinations that aren't a real branch page | **0** |
| Base-era redirect sources silently dropped | **0** |
| Base-era redirect sources re-pointed by the refactor | 62 (all intentional, all match `redirects-draft.json`) |
| Base-era nav URLs the branch neither serves nor redirects | **1** — row 18 |

The refactor's redirect work is in good shape. The single hole is row 18.

## Flags

1. **Row 8 is the only real conflict and it needs Winnie.** `main` and the refactor made opposite placement calls on project chart types, four days apart. My recommendation is to follow `main` (merge `data-apps/create-visualizations` into `explore/chart-types/custom-charts` as `## Project chart types`, re-point the redirect to the final URL), but it deletes a branch page and crosses two clusters, so it should not be decided inside either one.
2. **Row 1 has no cluster owner.** `get-started` isn't in the cluster split. Someone needs to own the SSH-tunnel page's placement, and it also raises a shape question — whether a conditional networking page belongs inside a 3-step linear Quickstart at all.
3. **Row 7 overlaps the refactor's own merge.** The branch consolidated upgrade docs into one page; `main` then shipped 694 lines across two new upgrade pages covering much of the same ground. One-home-per-fact can't hold for all three as written. Self-host cluster's call, but flagging it because it's easy to miss as a pure nav addition.
4. **Row 18 is a live bug on the branch right now**, independent of the whole `main` catch-up. Worth landing on its own before anything else.
5. **IA violations to fix on the way in, not port:** main's `guides/data-apps/maps` has a `title`/`sidebarTitle` divergence (row 4); none of main's 8 new pages declare `doc-type` (the branch's contract requires it); `guides/data-apps/building-locally` is framed as a "guide" but reads procedurally.
6. Rows 10 and 11 are the trap in this whole task: both look like trivial two-line ports and both silently introduce redirect chains. Neither should be applied as written.

## Proposed commits

1. `fix(nav): redirect the retired scheduler enablement page` — row 18. Standalone, unblocked, ships now. One redirect entry closing the last base-era 404 on the branch.
2. `docs(nav): add navigation and redirects for pages shipped on main` — rows 1–7, 12–16, 17. The eight nav entries plus the six new redirect entries and the link rewrites. Blocked on the placement/slug decisions in rows 1, 2, 4, 7 — but it is one coherent commit once those land, since every entry is "a page main shipped, given a home in the new tree".
3. `refactor(charts): consolidate project chart types into the custom charts reference` — row 8 plus its redirect consequence in row 10. Content commit owned by data-apps/explore; the docs.json half (re-point `/guides/data-apps/visualizations`, drop `data-apps/create-visualizations` from nav) folds into it rather than into commit 2.

Row 19 (delete or freeze `ia-audit/redirects-draft.json`) is bookkeeping — fold it into whichever commit closes the reorg phase rather than giving it its own.
