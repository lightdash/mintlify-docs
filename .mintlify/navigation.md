# Mintlify Navigation

The `navigation` tree in docs.json is where a docs IA becomes an interface. Page placement rules live in [`ia-rules.md`](ia-rules.md); this doc covers how navigation structure renders and how to choose between the primitives.

## Primitives

| Primitive | Renders as | Reach for it when |
| --- | --- | --- |
| `tabs` | Persistent horizontal row above the sidebar | 3–8 peer sections that should stay visible everywhere (this site: Docs, API) |
| `dropdowns` | Sidebar-top menu that swaps the whole rail | Sections are numerous/heavy, or nested inside one tab to hold parallel API surfaces |
| `global.anchors` | Icon rows pinned above every tab's sidebar | Persistent utility/outbound links only (community, blog, status) — never core content |
| `groups` | Sidebar sections (two styles — see below) | The main structure inside a tab |
| `versions` / `languages` | Switchers | Real version or locale splits only |

Group properties: `root` (landing page, makes the title a link), `directory` (`none`/`accordion`/`card` — body-of-root-page child listing, requires `root`, inherits recursively), `icon`, `tag` (badge pill), `hidden`, `expanded` (nested groups only), `boost` (search weight multiplier).

## The two group renderings

`root` on a top-level group changes its sidebar rendering — the load-bearing fact the official docs don't state (their "top-level groups always expand" claim predates root-group rows):

- **With `root`** — the group is a single collapsible row; clicking navigates to the root page *and* expands the page list. Collapsed unless active. The sidebar reads as a compact app-like nav of areas.
- **Without `root`** — a static bold section label with all pages permanently listed. The sidebar reads as a long scannable index.
- **Nested groups** are always collapsible rows and honor `expanded` (default collapsed; use `expanded: true` sparingly, for the one subgroup a first-time reader needs open). Expanding a nested group navigates to its `root` page, or to its **first listed page** when it has no `root` — collapsing never navigates. A nested group's first page is therefore its de facto landing; order pages accordingly.

Choose per tab, not per group: mixing both styles among sibling groups makes the rail incoherent. This site uses root-rows for the Docs tab (12 product areas, each with a `directory: "card"` landing page — ia-rules principle 12) and classic headers for the API tab.

`directory` never affects the sidebar. It only renders the auto child-listing on the root page body — if a sidebar looks wrong, `directory` is not the lever.

## Many peer areas

Mintlify's guidance assumes ≤7 top-level sections; this site's IA is 12 peer product areas, above the design center of every primitive. The levers, evaluated:

- **Root-rows + spacing correction (chosen).** Mint separates top-level groups with a 24px/32px margin sized for classic header sections; root-rows collapse to ~36px, so stock spacing reads as dead gaps. `styles.css` overrides it to 12px (`#navigation-items > ul.sidebar-group`), which by markup shape touches only root-row groups. The structure is fully supported docs.json; only one spacing constant is patched, and its failure mode is cosmetic. Re-verify in `mint dev` after platform updates — no docs.json property controls sidebar spacing.
- **Wrapper section headers** (areas nested under invented classic groups) fix spacing natively but add a taxonomy layer the IA doesn't have — peer areas don't cluster cleanly, and the wrapper names mislead (rejected here: "Extend" demotes Data apps, Integrations spans admin).
- **Dropdowns/tabs/anchors per area** hide the product map behind a switcher, or overflow their intended counts. **Products** is for separate full sites. **Dropping `root`** breaks area landing pages. All rejected.

DOM details, selector stability, and the agent-browser measurement recipe: [sidebar-rendering](sidebar-rendering.md).

## Mapping rules

Grounded in a survey of Mintlify's own docs, Dub, Mem0, Neutron, and Trigger.dev (raw docs.json for each):

1. **One top-level primitive, one split axis** — doc type, audience, or product edition; never mixed in the same row.
2. **Groups stay scannable at ~3–10 pages.** Bigger areas split into subgroups rather than walls of links; a directory over ~12 children triggers a sectional review (ia-rules).
3. **Nesting caps at 3 levels; 4 only for reference-dense trees.**
4. **Every group gets a landing page the same way** — `root` everywhere or overview-first-page everywhere, never mixed within a tab.
5. **Icons are all-or-none per level.** Icon every group or no groups; same for tabs and pages within a group. (Surveyed sites are strict about this; partial icons read as clutter.)
6. **One header casing per site.**
7. **`boost`, `menu`, `hidden` are needs-driven edge tools**, not defaults — e.g. boost the Get started group, damp the changelog.
8. **Every URL change ships its redirect** — nav reorganization breaks URLs by design; all surveyed sites carry large `redirects` arrays.

## Sidebar hygiene

- A title long enough to wrap its `tag` pill onto its own line gets a `sidebarTitle` (shortened, never divergent — ia-rules principle 6).
- `tag` is a one-pill slot: lifecycle badge outranks doc-type pill.
- Verify sidebar changes in `mint dev` against both group styles and an expanded long group before shipping.
