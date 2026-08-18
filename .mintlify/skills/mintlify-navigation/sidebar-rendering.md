# Sidebar rendering internals (mint theme)

Verified against a live `mint dev` preview of this repo and the rendered DOM of mintlify.com/docs. Everything here is mint-theme-specific; other themes (maple, palm, willow, aspen, almond, linden…) restyle navigation differently.

## What Mintlify officially supports

Any `.css` file in the content directory is auto-included on every page — no import or docs.json reference needed. Documented sidebar hooks ([custom scripts & styles](https://www.mintlify.com/docs/customize/custom-scripts)): IDs `#sidebar` and `#sidebar-content`; classes `.sidebar-group` (a group's link list), `.sidebar-group-header`, `.sidebar-group-icon`, `.sidebar-title`, `.sidebar-nav-group-divider` (only emitted when a divider is configured).

Mintlify's own caveat: "references and styling of common elements are subject to change… breaking changes may occur in future updates." Documented hooks are the safest targets; Tailwind utility classes and undocumented wrappers (including `#navigation-items`, which is semantic but absent from the documented list) can change on any platform update — re-verify in the preview before relying on them.

## Two markups for a top-level group

Which one a group gets is decided by `root`:

**Root-linked collapsible group** (`root` set) — the whole group is one clickable row; clicking it navigates to the root page *and* expands the page list in place (verified: URL changes and `aria-expanded` flips in one click). Collapsed height ≈ 36px; groups sit collapsed unless active.

```html
<div id="navigation-items">
  <ul class="sidebar-group mt-6 lg:mt-8 space-y-px">   <!-- ul itself carries the margin -->
    <li id="/explore">
      <button>Explore ›</button>
      <ul class="space-y-px">…pages (only when expanded)…</ul>
    </li>
  </ul>
</div>
```

**Classic header group** (no `root`) — a static bold label with its pages always expanded beneath. No chevron, label is not a link.

```html
<div class="mt-6 lg:mt-8">                              <!-- wrapper div carries the margin -->
  <div class="sidebar-group-header … pl-4 mb-3.5 lg:mb-2.5">API</div>
  <ul class="sidebar-group space-y-px">…pages…</ul>
</div>
```

In classic markup the first group's wrapper is a bare `<div>` (no margin); only subsequent wrappers carry `mt-6 lg:mt-8`, and the wrapper itself has no documented class hook — `.sidebar-group` and `.sidebar-group-header` are its children. Note mintlify.com's own docs only ever set `root` on *nested* subgroups (CLI, Components), so their top-level groups all use classic markup; the collapsible-row markup above is what top-level `root` groups produce, verified in this repo's preview.

Global anchors (About Us / Community / Blog) render above both as a plain `ul.list-none` inside `#navigation-items`.

## Spacing model

- Rows within a group: `space-y-px` (1px).
- Between top-level groups: `mt-6 lg:mt-8` (24px, 32px ≥lg) on the elements shown above.
- That 24/32px is sized for classic header groups, where it separates one group's page list from the next label. When every group is a collapsed 36px row, it produces near 1:1 dead space and the sidebar reads as broken ("weird gaps").

## The override in styles.css

```css
#navigation-items > ul.sidebar-group {
  margin-top: 12px;
}
```

- Matches only root-linked collapsible groups: they are the only bare `ul.sidebar-group` directly under `#navigation-items`. Classic header groups keep stock spacing because their margin sits on the wrapper div.
- The ID-selector specificity beats the Tailwind utility, so no `!important`.
- 12px stays legible with a group expanded: member pages are indented and 1px-spaced, so a 12px break still reads as a boundary.

## Undocumented-but-semantic hooks observed

Beyond the documented set: `#navigation-items` (the container of all group elements), `li` ids equal to each entry's path (e.g. `li[id="/explore"]`), and `data-title`/`data-active` attributes on page `li`s. Mintlify toggles dark mode via a `dark` class on `<html>`.

## Verifying changes

Run `mint dev`, then measure rather than eyeball — with agent-browser:

```bash
agent-browser open http://localhost:3333 && agent-browser eval --stdin <<'EOF'
(() => {
  const gs = [...document.querySelectorAll('#navigation-items > ul.sidebar-group')];
  let prev = null;
  return gs.map(ul => {
    const r = ul.getBoundingClientRect();
    const gap = prev === null ? null : Math.round(r.top - prev);
    prev = r.bottom;
    return `${ul.textContent.trim().slice(0, 14)}: gap=${gap} h=${Math.round(r.height)}`;
  }).join(' | ');
})()
EOF
```

Check both sidebar modes (a root-linked tab like Docs and a classic tab like API), and a page that expands a long group, before shipping spacing changes.
