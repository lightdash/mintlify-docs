# Mintlify component reference

Mintlify's component surface and prop lists, as of the `mint` theme. Which of these this site uses, and for what, is [`components.md`](components.md) — read that first. This file answers "what props does it take".

Props marked **req** are required. Icon-bearing props accept a Tabler name (this site's library), an external URL, a root-relative project path, or inline SVG in braces; `iconType` is Font Awesome-only and inert here.

## Callouts

`<Note>` `<Tip>` `<Info>` `<Warning>` `<Check>` `<Danger>` take `children` only — icon and colour are fixed per variant.

`<Callout>` takes them as props:

| Prop | Type | Notes |
| --- | --- | --- |
| `icon` | string | Icon name, URL, path, or SVG |
| `iconType` | string | Font Awesome only |
| `color` | string | Hex. Sets border, background tint, and text colour together |

## Badge

| Prop | Type | Default | Values |
| --- | --- | --- | --- |
| `color` | string | `gray` | `gray` `blue` `green` `yellow` `orange` `red` `purple` `white` `surface` `white-destructive` `surface-destructive` |
| `size` | string | `md` | `xs` `sm` `md` `lg` |
| `shape` | string | `rounded` | `rounded` `pill` |
| `icon` | string | — | Icon name, URL, path, or SVG |
| `stroke` | boolean | `false` | Outline instead of filled |
| `disabled` | boolean | `false` | Reduced opacity |
| `className` | string | — | |

Renders inline, so it can sit in a sentence or after a heading.

## Frame

| Prop | Type | Notes |
| --- | --- | --- |
| `caption` | string | Centred below the frame. Supports Markdown |
| `hint` | string | Text above the frame |

Wraps images, `<video>`, iframes, and other components; constrains them to the column width. A `<video autoPlay>` inside a Frame automatically gains `playsInline`, `loop`, and `muted`.

## Tabs

`<Tabs>`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `defaultTabIndex` | number | `0` | Zero-based |
| `sync` | boolean | `true` | Syncs with tabs and code groups whose labels match, anywhere on the page |
| `borderBottom` | boolean | — | Adds a bottom border and padding |

`<Tab>`

| Prop | Type | Notes |
| --- | --- | --- |
| `title` | string | **req** — also the sync key and the anchor |
| `id` | string | Anchor override; defaults to `title` |
| `icon` / `iconType` | string | |

## CodeGroup

`<CodeGroup>` takes `dropdown` (boolean) to render a dropdown instead of tabs, and inherits code styling from `docs.json` `styling.codeblocks`. Tab labels come from each fence's meta string — `` ```yaml dbt v1.9 and earlier `` — and sync with `<Tabs>` on matching labels.

## Accordion

`<Accordion>`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | string | — | **req** — also the anchor |
| `description` | string | — | Secondary line under the title |
| `defaultOpen` | boolean | `false` | |
| `id` | string | — | Anchor override |
| `icon` / `iconType` | string | — | |

Expanding sets the URL hash, so an open accordion is linkable. `<AccordionGroup>` wraps siblings and takes no props.

## Steps

`<Steps>` takes `titleSize` (`p` · `h2` · `h3` · `h4`, default `p`) and `children`.

`<Step>`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | string | — | **req** |
| `icon` / `iconType` | string | — | |
| `stepNumber` | number | — | Explicit numbering |
| `titleSize` | string | inherits | |
| `id` | string | — | Anchor override |
| `noAnchor` | boolean | `false` | Suppresses the anchor link |

## Card and Columns

`<Card>`

| Prop | Type | Notes |
| --- | --- | --- |
| `title` | string | |
| `href` | string | Destination |
| `icon` / `iconType` | string | |
| `color` | string | Hex, colours the icon |
| `cta` | string | Button text |
| `arrow` | boolean | Link arrow |
| `horizontal` | boolean | Compact horizontal layout |
| `img` | string | Image across the card top |
| `type` | string | Callout theming: `info` `warning` `note` `tip` `check` `danger` |

`<Columns>` takes `cols` (1–4, default 2) and holds cards or `<Column>` wrappers around arbitrary content. `<CardGroup>` is the older name for the same thing.

## Icon

| Prop | Type | Notes |
| --- | --- | --- |
| `icon` | string | Library name |
| `src` | string | Project path or URL, instead of `icon` |
| `iconType` | string | Font Awesome only |
| `size` | number | Pixels |
| `color` | string | Hex |
| `className` | string | |

## Mermaid

A fenced block with the `mermaid` language. Zoom and pan controls appear automatically above 120px tall; `actions={false}` removes them and `placement` moves them (`top-left` `top-right` `bottom-left` `bottom-right`, default `bottom-right`). Complex graphs can opt into the ELK layout engine with `%%{init: {'flowchart': {'defaultRenderer': 'elk'}}}%%` on the first line.

## Others

| Component | Props |
| --- | --- |
| `<Tooltip>` | `tip` **req**, `headline`, `cta`, `href` (**req** with `cta`) |
| `<Expandable>` | `title`, `defaultOpen` (default `false`). Nests inside `ParamField` / `ResponseField` |
| `<Update>` | `label` **req**, `description`, `tags` (array), `rss` (`{title, description}`) |
| `<Tree>` / `<FileTree>` | `Tree.Folder`: `name` **req**, `defaultOpen`, `openable`, `highlight`. `Tree.File`: `name` **req**, `highlight` |
| `<Color>` | `variant` **req** (`compact` · `table`), `Color.Row` `title`, `Color.Item` `name` + `value` (hex/rgb/hsl/oklch, or `{light, dark}`) |
| `<Visibility>` | `for` **req** (`humans` · `agents`) — routes content between the web page and the `.md` export |
| `<Prompt>` | `description` **req**, `children` **req**, `actions` (`copy` · `cursor`), `icon` / `iconType` |
| `<Tile>` | `href` **req**, `children` **req**, `title`, `description` |
| `<Panel>` | Replaces the right-hand table of contents. Suppressed under `mode: wide` / `center` / `custom` |
| `<ParamField>` | Location attr (`query` · `path` · `body` · `header`), `type`, `required`, `deprecated`, `default`, `placeholder` |
| `<ResponseField>` | `name` **req**, `type` **req**, `default`, `required`, `deprecated`, `pre`, `post` |

## Images

Root-relative paths only. Files cap at 20 MB. `noZoom` disables click-to-zoom; `actions="copy,download"` adds controls. Light and dark variants pair `className="block dark:hidden"` with `className="hidden dark:block"`. Mintlify strips `foreignObject` from SVGs, which truncates text exported from draw.io unless Formatted Text and Word Wrap are off.

## docs.json settings that affect components

| Key | Values | Notes |
| --- | --- | --- |
| `icons.library` | `fontawesome` · `lucide` · `tabler` | Default `fontawesome`; this site sets `tabler` |
| `styling.codeblocks` | `system` · `dark` · Shiki theme name · object | Default `system` |
| `styling.eyebrows` | `section` · `breadcrumbs` | Default `section` |
| `styling.latex` | boolean | Loads the LaTeX stylesheet |
| `colors.primary` | hex | **req** — emphasis in light mode |
| `colors.light` / `colors.dark` | hex | Emphasis in dark mode; buttons and hover in both |
| `banner` | `{content, dismissible, type, color}` | `type`: `info` · `warning` · `critical` |
