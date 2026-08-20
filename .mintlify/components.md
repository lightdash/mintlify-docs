# Components and styling

Which component does which job on this site, and what a page is allowed to choose. Mintlify's full component surface and prop lists are in [`component-reference.md`](component-reference.md); page placement is [`ia-rules.md`](ia-rules.md).

**Pick a component by the job it does for the reader, never by how it looks.** Appearance is decided once, here. A page never reaches for a colour, a custom callout, or a class to make something stand out — it reaches for the component whose meaning matches, and the styling follows. If no component's meaning matches, the content is prose.

**Components are punctuation, not paragraphs.** Every one of them interrupts the reading line. A page that is mostly components has no argument, just fragments — the reader skims the boxes and misses the sentence that connected them.

## Callouts

Six variants, one job each. The job is defined by what the reader should *do*, which is what makes the choice testable.

| Component | Job | Test |
| --- | --- | --- |
| `<Note>` | Context worth knowing that changes nothing | The reader can skip it and still succeed |
| `<Tip>` | An optional better way | They succeed without it; they do better with it |
| `<Info>` | A scope gate — whether this page applies to them at all | Plan, deployment, permission, or version prerequisite |
| `<Warning>` | A cost they'll pay for ignoring it | Ignoring it means a wrong result, lost work, or a broken deploy |
| `<Check>` | Confirmation a step worked | "You should now see…" — only inside a procedure |
| `<Danger>` | Irreversible destruction | Drops data or deletes content with no undo |

`<Note>` is the default. When two fit, take the weaker one: a `<Warning>` in a page of nine `<Warning>`s warns nobody.

**Scope gates go first and go once.** An `<Info>` stating plan or deployment availability sits directly under the frontmatter, before the first sentence — a reader who isn't eligible should learn it before reading the page, not on the way out. One per page. Availability that appears on more than one page is a `snippets/` transclusion, not a retyped sentence (ia-rules principle 5).

**Density.** Never two callouts back to back — merge them or demote one to prose. Never a callout as the first thing under a heading unless it's the page's scope gate. Never a heading inside a callout: a callout that needs a heading is a section.

**`<Callout>`** — the custom-icon, custom-colour variant — is not a general escape hatch. It is reserved for the small set of site-level editorial moments listed under [Colour](#colour). Everything else uses a typed callout above.

## Lifecycle and availability

Two independent axes. A feature can be Beta *and* Enterprise-only; they are separate marks and never collapse into one.

**Lifecycle** is the three levels defined in [feature maturity levels](../support/feature-maturity-levels.mdx) — Experimental, Beta, and GA. There is no fourth level: "Preview", "Alpha", and "Early access" are not states this product has, and a feature described that way is one of the three.

**GA is the unmarked default.** It gets no badge, no `tag`, and no sentence saying so — marking the normal case just teaches readers to ignore the marks that matter.

| Status | Frontmatter | Badge |
| --- | --- | --- |
| Experimental | `tag: "Experimental"` | `<Badge icon="test-pipe-2" color="orange" size="sm" shape="pill">Experimental</Badge>` |
| Beta | `tag: "Beta"` | `<Badge icon="flask" color="purple" size="sm" shape="pill">Beta</Badge>` |
| Deprecated | `tag: "Deprecated"` | `<Badge icon="haze-moon" color="gray" size="sm" shape="pill">Deprecated</Badge>` |
| GA | — | — |

Deprecated is not a maturity level — it is where a feature goes after GA. Its badge is grey because the feature still works and needs no attention from most readers; red would read as broken.

**A status is always a badge, never styled text.** That holds everywhere the status appears, including inside a scope gate. Bold or linked words carry no consistent styling and nothing a reader learns to scan for:

```mdx
<Info>
  <Badge color="purple" size="sm" shape="pill">Beta</Badge> Custom granularities are available on all plans. [What Beta means](/support/feature-maturity-levels).
</Info>
```

**A page about a non-GA feature carries the `tag` in frontmatter**, which is what puts the pill in the sidebar — a reader should see the level before they click, not after. The inline `<Badge>` is for a non-GA *section* of an otherwise-GA page, and a page carrying the `tag` doesn't repeat it as a badge on its own title.

**Lifecycle marks describe Lightdash features.** A third party's beta or preview status — an Azure preview service, a Cloud Run feature — is a fact about that vendor and stays prose. Badging the page would tell readers a Lightdash feature is Beta when it isn't.

**Availability** is which customers can reach the feature.

| Condition | Badge |
| --- | --- |
| Enterprise plan | `<Badge icon="building-plus" color="blue" size="sm" shape="pill">Enterprise</Badge>` |
| Self-hosted deployments only | `<Badge icon="server" color="blue" size="sm" shape="pill">Self-hosted</Badge>` |
| Lightdash Cloud only | `<Badge icon="cloud-bolt" color="blue" size="sm" shape="pill">Cloud</Badge>` |

**A badge gates, it never labels.** It answers whether the reader can use the thing, and a reader who cannot is meant to stop. A badge describing what the page is about — the tool it uses, the surface it covers — fails the test, because that badge could be justified on any page and so distinguishes none of them. If the page's area, title, or first sentence already implies it, it is a label.

**The colour carries the axis, the icon carries the value.** Availability is blue throughout, so a reader learns that blue means "who can reach this" and reads the icon for which condition. Lifecycle spends its colours on urgency instead: orange for the earliest stage, purple for the settled-but-moving one, grey for the one on its way out.

**Never link a badge, or wrap one in a link.** The theme underlines links with the surrounding text colour, which either cuts through the pill or draws a line beneath it. A badge is a label, not a control.

**Reserved, and unused today.** Doc type would be the third axis if it is ever shown, in green so it cannot be mistaken for either of the others: Guide `map-check`, Tutorial `list-numbers`. Do not use them until the sidebar shows doc-type pills again.

Badges sit on the line they qualify — leading a scope gate, immediately after a heading, or inline in the sentence naming the feature. Bold text (`**Beta:**`, `**Availability:**`, `**Enterprise only.**`) is never a substitute.

A badge states the level and stops — the sentence beside it never names the level again. `<Badge>Beta</Badge> Agent memory is a Beta feature` says one thing twice and leaves the reader nothing to act on. Use the sentence for what the level *means here*: who can reach it, what might change, what it costs.

A gate whose sentence only restates its badge is not carrying its weight; the frontmatter `tag` already puts that level in the sidebar.

## Frontmatter descriptions

**One sentence, at most 100 characters.** The description is the search snippet *and* the subtitle on every card that lists the page, and the card is the tighter constraint — past that it wraps into a block that crowds the cards beside it.

Say what the page gives the reader, not what the feature is. No trailing period, no "This page explains", no second sentence carrying a caveat — a caveat belongs on the page.

```yaml
description: "Every option for defining and configuring dimensions in YAML"   # 62
description: "Rolling windows calculate metrics like rolling averages using the current row combined with N previous rows. This can be useful for smoothing out noise."   # 160, and two sentences
```

## Media

**Every image, video, diagram, and iframe is wrapped in `<Frame>`.** Frames constrain content to the column, so an unwrapped iframe overflows the layout, and an unwrapped image sits flush against the prose with no separation. There is no exception for small images.

```mdx
<Frame caption="The chart config panel, with the Y-axis section open">
  <img src="/images/explore/configure-charts/y-axis-panel.png" alt="Chart config panel showing Y-axis options" />
</Frame>
```

- **Paths are root-relative** — `/images/…`, never `../images/…`. Relative paths don't resolve on the built site.
- **`alt` describes what's in the image**, for readers who can't see it. Not the filename, not empty.
- **`caption` when the image needs naming** — when the surrounding prose doesn't already say what the reader is looking at, or when the image is far enough from its sentence to lose the connection. A caption that repeats the sentence above it is noise; skip it.
- **Videos are iframes in a Frame**, sized `width="100%" height="420"`. The `<Video>` component doesn't exist; `<video>` is for files we host, which we don't.

## Alternatives: code groups, tabs, and accordions

Three ways to show more than one path. They are not interchangeable.

| The alternatives are… | Use | Why |
| --- | --- | --- |
| Only code — same task, different language, version, or tool | `<CodeGroup>` | Titles come from the fence (```` ```yaml dbt v1.10+ and Fusion ````), and it's the lighter control |
| Mixed — prose, steps, images alongside the code | `<Tabs>` | Only tabs hold arbitrary content |
| Detail most readers will skip | `<Accordion>` | Not an alternative at all — it's a thing you're hiding |

**Labels are a site-wide contract.** Mintlify syncs tabs and code groups across a page by exact label match, so a reader who picks their dbt version once should keep it everywhere on the page. The canonical sets:

| Axis | Labels, verbatim |
| --- | --- |
| dbt version | `dbt v1.10+ and Fusion` · `dbt v1.9 and earlier` |
| Config surface | `Lightdash YAML` · `dbt YAML` |
| Install method | `npm` · `Homebrew` · `Docker` · `Docker Compose` |
| Deployment | `Lightdash Cloud` · `Self-hosted` |

A near-miss (`dbt v1.10+` where the rest of the site says `dbt v1.10+ and Fusion`) silently breaks syncing. Match the string exactly or add the new one here.

**Accordions hide the side quest, never the path.** A step a reader must take to succeed is never behind a click. Troubleshooting cases, per-warehouse setup detail, and optional deep dives are exactly what accordions are for. Two or more siblings go in an `<AccordionGroup>` so they read as one set rather than a stack of loose boxes.

## Tables

**A table fits the page or it isn't a table.** Sideways scrolling hides columns behind an edge the reader has to discover, and the first thing to vanish is the row label that made the rest mean anything.

**Four content columns is the ceiling for a table of prose.** Past that, cells wrap into narrow ribbons and the table scrolls on a laptop. When a fifth column wants in, one of these is true:

- **It's redundant.** A trailing "Learn more" column of links usually repeats the first column — link the first column's label instead and delete the column.
- **It's a second table.** The columns split cleanly into two topics that share a key.
- **It's a list.** The rows have little in common; each is a heading with prose under it.

**Two kinds of table earn their width**, because in both the columns are the content rather than a layout accident:

- **Glyph matrices.** Cells are single `check`/`x` glyphs, so a cell is one character wide and eight columns still scan.
- **Reference tables.** A `doc-type: reference` page exists to be exhaustive; a lookup that genuinely has six axes is the form working, not a page that failed to edit itself. Cutting columns there would cost the reader the comparison they came for.

Neither is licence to sprawl — a Reference page whose *prose* table drifted wide is still a page that needs editing. What the exemption buys is the comparison a lookup is for.

**A wide table pins its first column, always.** Both exemptions come with the same cost: wrap the table so the row label survives the scroll, because the label is what makes every other cell mean anything.

```mdx
<div className="sticky-first-col">

| Permission | Viewer | Editor | Developer | Admin |
| --- | --- | --- | --- | --- |
| View charts | <Icon icon="check" /> | <Icon icon="check" /> | <Icon icon="check" /> | <Icon icon="check" /> |

</div>
```

Blank lines around the table are required — without them Mintlify renders the pipes as literal text.

## Procedures

`<Steps>` is for an ordered sequence where each step is an action the reader takes and the order is load-bearing. A list of options, a list of concepts, or a set of independent settings is a list — numbering it implies a sequence that doesn't exist.

One `<Steps>` per procedure. Don't nest them, don't wrap a whole page in one, and don't restart numbering mid-page — if a page has three procedures, it has three headings.

## Cards

Area landing pages list their children through `directory: "card"` in `docs.json`, never by hand (ia-rules principle 12). A hand-built card grid on a landing page duplicates the auto-rendered one and goes stale the first time a page is added.

That leaves one job for `<Card>`: a small set of deliberate cross-area jumps, where the destination is in a different part of the product and the prose has a reason to send the reader there. Wrap two or more in `<Columns cols={2}>`. `<CardGroup>` is the older spelling of `<Columns>`; write `<Columns>`.

## Icons

The library is Tabler, set once in `docs.json` (`icons.library`). Use [Tabler's names](https://tabler.io/icons) exactly — an unrecognised name renders nothing, silently. `iconType` is Font Awesome-only and does nothing here; leave it off.

Tabler is the library because its chart set is the one that covers this product: `chart-treemap`, `chart-sankey`, `chart-funnel`, and `chart-area-line` all exist, and the chart-type gallery is the most icon-dense surface on the site.

**Only top-level areas carry icons.** All twelve do, in `docs.json`; no nested group does, and no page does. Icons are all-or-none per level (navigation rule 5) — a lone icon on one subsection reads as a rendering fault rather than a distinction, and the sidebar stops being scannable the moment the pattern is mixed. A page or nested group that feels like it deserves one is asking to be a top-level area instead, which is an IA question (ia-rules principle 12), not an icon question.

**Carve-outs are listed here or they don't exist.** There is one:

| Carve-out | Why |
| --- | --- |
| `explore/chart-types/*` | The gallery *is* the icon — a reader picks a chart by shape, and the card grid is how the area is navigated |

Inside a carve-out the rule is all, not some: every page in it carries an icon, because a half-iconed card grid reads as broken. Icons there live in page frontmatter (`icon: "chart-sankey"`), which drives both the sidebar row and the card on the parent's landing page.

| Area | Icon |
| --- | --- |
| Get started | `rocket` |
| Explore | `telescope` |
| Semantic layer | `stack-2` |
| Workflow | `git-branch` |
| Agents | `robot` |
| Data apps | `cube-spark` |
| Embed | `image-in-picture` |
| Integrations | `plug` |
| Workspace admin | `shield-cog` |
| Personal settings | `user-cog` |
| Self-host | `server-bolt` |
| Support | `lifebuoy` |

Chart types name the chart, not a generic graph: `chart-bar`, `chart-line`, `chart-area`, `chart-area-line` (mixed), `chart-scatter`, `chart-pie`, `chart-funnel`, `chart-treemap`, `chart-sankey`, `table`, `gauge`, `number-123` (big value), `world` (map).

**In prose, an icon means a value in a table** — a support matrix or comparison cell — and nothing else. `check` for yes, `x` for no; use both or neither, so the column reads as a pair. The boxed `square-check` shape reads as a checkbox, which implies something the reader can tick; a matrix cell is a statement, not a control.

```mdx
| Capability | Viewer | Editor |
| --- | --- | --- |
| View charts | <Icon icon="check" /> | <Icon icon="check" /> |
| Edit charts | <Icon icon="x" className="matrix-no" /> | <Icon icon="check" /> |
```

The `check` is unstyled and takes the page's emphasis colour. The `x` carries `matrix-no`, which recedes it, so what a role *can* do holds the weight — readers scan these tables for capabilities, not for gaps. The colour lives in `styles.css` and is set per theme; a single hex on the component would render brighter than the check in dark mode and invert the hierarchy.

Red and green are the obvious alternative and the wrong one: red reads as an error, and a role simply not having a permission is the design working, not a fault.

Decorative icons in running text are noise. An icon in a heading, beside a link, or celebrating a successful install adds nothing a reader needs.

## Colour

**An agent writing a page never picks a colour.** Typed callouts, badges, and cards carry theirs; that is the whole point of choosing them by meaning. Hex values appear in exactly two places on this site, and both are listed below.

The tokens, from the Lightdash palette:

| Token | Hex | Stands for |
| --- | --- | --- |
| Brand | `#5E4CFF` | Lightdash itself; the settled, GA, primary state |
| Accent | `#9D8DFF` | Secondary emphasis |
| Muted | `#9990C4` | Neutral, de-emphasised |
| Series purple | `#5C52D6` | Data series 1 |
| Series lilac | `#D9B3FF` | Data series 2; the in-progress state |
| Series mint | `#83E2B7` | Data series 3; the early, exploratory state |
| Ink | `#ECE9FF` | Light tint background |
| Glass | `#0B0B0D` | Near-black fill and text on light surfaces |

**Mermaid diagrams** are the first place hexes appear. Colour carries meaning or it's left off — a flowchart whose nodes are coloured for variety is harder to read than one that's plain. Lifecycle diagrams read Experimental → `Series mint`, Beta → `Series lilac`, GA → `Brand`; sequences read left-to-right from `Series mint` through `Series lilac` to `Brand`. Node text on Brand is white, on everything else `Glass`.

**Custom `<Callout>`s** are the second, and there are two sanctioned ones:

| Moment | Form |
| --- | --- |
| Point an agent at machine-readable docs | `<Callout icon="message-chatbot" color="#9990C4">` |
| Name the audience a page is written for | `<Callout icon="tool" color="#9990C4">` |

Anything else that wants a custom callout is a typed callout that hasn't been chosen yet.

Site-wide colour — brand primary, dark mode, backgrounds — lives in `docs.json` `colors` and `styles.css`. Changing it is a design decision, not a docs change.

## Checking your work

`npm run audit:components` reports every mechanical rule on this page — unframed media, relative image paths, missing alt text, unknown or misplaced icons, stacked callouts, code-only tabs, sync-label drift, tables that scroll, and pages whose maturity statement and frontmatter `tag` disagree. It summarises by rule and by area; `--rule <name>` lists the individual findings.

Two gates sit behind it, and the split is what keeps enforcement honest while the corpus still carries debt:

- **Blocking rules** run inside `validate:docs` and fail the build. A rule is promoted once the corpus is clean of it, so a change is never blocked by debt it did not create. Every rule on this page blocks today.
- **The baseline ratchet** is the holding pen for anything not yet clean. `scripts/docs/component-baseline.json` records how many findings each rule carries, and `npm run audit:components -- --baseline` fails if any rule gained one. It is empty, and a new rule lands there before it graduates.

Findings are annotated inline on the pull request diff, on the line that caused them, scoped to the files the change touched.

Lowering a count is free — fix pages and the ratchet follows. Raising one is deliberate: run `npm run audit:components -- --update-baseline` and say in the commit why the debt grew. When a rule reaches zero, move it into `BLOCKING_RULES` so it can never come back.

`npm run fix:components` applies the two fixes that need no judgment: rewriting image paths against the page's own directory, and wrapping block-level media in `<Frame>`. It reports anything whose context makes wrapping a judgment call rather than guessing.

Judgment calls — which callout variant fits, whether an accordion is hiding the path — no gate can make for you.

## Components this site doesn't use

Not a prohibition list — a list of things that look applicable and aren't, so nobody relitigates them page by page.

| Component | Instead |
| --- | --- |
| `<Panel>` | Suppressed by `mode: "wide"`, which the landing pages use. Put the content in the page. |
| `<Tile>` | Needs bespoke 800×450 artwork per entry. `<Card>` for cross-area jumps. |
| `<Update>` | Changelog format; the product changelog lives outside these docs. |
| `<Banner>` | Site-level, configured in `docs.json`, not written into a page. |
| `<Prompt>` | Ships a Cursor deep-link; agent guidance goes in `.mintlify/skills/`. |
| `<ParamField>` / `<ResponseField>` | The API reference is generated from OpenAPI. |

`<Tooltip>`, `<Tree>`, and `<Visibility>` are unused but fit the site — a first use should be deliberate and consistent, not incidental.
