# Cluster: workflow / CLI / content-as-code

## Summary

Four real content additions landed on `main` in this area: a dashboard migration walkthrough on
`dashboards-as-code`, a `lightdash apps validate` command plus three `lightdash upload` data-app
flags in the CLI reference, a theme-as-code package contract, and a fleshed-out direct-binary
install path. None of them conflicts with what the refactor rewrote — the refactor's
content-as-code split (e583028) moved virtual views and VS Code out, but left `lightdash download`
/ `lightdash upload` and the org-scoped as-code sections in place, so every delta has a live
destination. Two structural calls fall out of the refactor rather than out of `main`: the
migration walkthrough is a Tutorial that does not belong inside a 6,300-word Reference, and
theme-as-code is a cross-area fact that needs one home picked between `workflow/` and `data-apps/`.

The one genuine gap is a dependency, not a conflict: `03a8b38` (themes) and my CLI-reference rows
edit sentences and sections that `a57c11e` (org users and groups as code) introduced, and
`a57c11e` was not assigned to any cluster. See Flags.

## Mapping

| # | Net change | Source | Destination | Action | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Walks the full download → upload round-trip for copying a dashboard to another project or instance, including login/`config set-project` per side, UUID variants, `--strip-pivot-series` on download, and `--force --include-charts --include-virtual-views --validate` on upload | `4517249`, `278b3ac` — `guides/developer/dashboards-as-code.mdx` § "Migrating a dashboard between Lightdash instances or projects" | **NEW** `workflow/migrate-dashboards-between-projects.mdx` | `new-page` | `doc-type: tutorial` + `tag: Tutorial`; title "Migrate dashboards between projects", `sidebarTitle: "Migrate dashboards"`. Nav: `docs.json` Workflow group, directly after `workflow/content-as-code` (takes the group to 10 top-level entries, under the ~12 trigger). No redirect needed — the source only ever existed as an anchor on a page that already redirects to `/workflow/content-as-code`, and Mintlify redirects don't match fragments. Rewrite the two inbound links: `/references/lightdash-cli` → `/workflow/cli/reference`, and the `#make-downloaded-charts-portable-across-projects` anchor → `/workflow/content-as-code#make-downloaded-charts-portable-across-projects`. Add a line distinguishing it from [`/explore/promote-content`](../../explore/promote-content.mdx), which solves the same user question (preview → production, same instance, via UI upstream-project config) by a different mechanism — without that link we ship two competing answers to "how do I move a dashboard". Rationale for the page over a section is in Flags. |
| 2 | Summary table of what download and upload include automatically vs. behind a flag (charts, virtual views, data apps) | `4517249` — same page, § "What's included automatically" | `workflow/content-as-code.mdx`, new `### What download and upload include` under `## lightdash upload` (after line 279, before `## Lightdash content templates`) | `split` | This is a Reference fact, not a step in a journey — keeping it in the Tutorial (row 1) would put a flag matrix in a walkthrough (principle 3) and restate flag semantics already in `workflow/cli/reference.mdx` (principle 1). Land it once on the canonical content-as-code page and have the Tutorial link to it. Verify the row for data apps against `workflow/cli/reference.mdx` `--include-apps` / `--apps` before shipping — main's table says upload includes data apps "Automatic", which reads as contradicting the opt-in `--apps` flag description on the same corpus. |
| 3 | Documents `lightdash upload --apps-only`, `--app-space <spaceRef>`, and `--allow-custom-dependencies` | `765f132` — `references/lightdash-cli.mdx` § `lightdash upload` Options | `workflow/cli/reference.mdx` § `lightdash upload` → **Options** (branch list ends at `--organization`, line ~947) | `port` | Insert after `--include-apps` once row 11's dependency lands; if it doesn't, insert after the existing `--apps [appUuids...]`. Rewrite `--allow-custom-dependencies`'s link `/guides/data-apps/building-locally#experimental-custom-dependencies` → the data-apps cluster's destination for that page. The `guides/data-apps/building-locally.mdx` half of this commit is **cluster-dataapps'**, not mine. |
| 4 | Documents the `lightdash apps validate` command — checks manifest, lockfile, connection aliases, and semantic references against the local `.lightdash/context/` snapshot or `--live`; `--format json`; non-zero exit for CI | `8fccfed` — `references/lightdash-cli.mdx` | `workflow/cli/reference.mdx`: new `### lightdash apps validate` + a row in the command table (§ Commands, line ~96) | `port` | The branch reference has **no** `lightdash apps create` / `apps preview` / `apps validate` sections at all — all three arrived on `main` after `BASE`. `apps create` and `apps preview` come from `82588be` (data-apps cluster). Land all three together or the ordering and the `#lightdash-apps-*` anchors that `data-apps` pages link to will be half-broken. Rewrite `/guides/data-apps/building-locally` links to the data-apps destination. |
| 5 | Documents Data App themes as an organization content-as-code package: `lightdash/themes/<slug>/` layout, `lightdash-theme.yml` manifest, accepted asset types and size limits, sync/preflight semantics, and the "upload doesn't restyle existing app versions" evaluation note | `03a8b38` — `guides/data-apps/themes.mdx` § "Manage themes as code" + `guides/developer/dashboards-as-code.mdx` § "Data App themes as code" | `workflow/content-as-code.mdx`, new `## Themes as code` immediately before `## Custom roles as code` (line 833); 2–3 sentences + link on `data-apps/customize-themes.mdx` | `decide` | **Cross-area landing — my recommendation:** the package format, validation limits, and sync behavior are CLI/`--organization` facts and belong in `workflow/content-as-code.mdx` next to `## Custom roles as code`, which is exactly the precedent the branch already set for the other org-scoped resource. `data-apps/customize-themes.mdx` gets a pointer only: it's a 652-word `doc-type: tutorial`, and main's version drops ~800 words of reference material into it, which is type drift (principle 3) and would more than double the page. **Option B** is main's shape (contract on the themes page, pointer from content-as-code) — cheaper to port, but it makes the CLI package format live in `data-apps/` while the identical-shaped custom-roles contract lives in `workflow/`, which is the naming/placement inconsistency the refactor exists to remove. Whichever way it goes, the `--organization` descriptions on `workflow/cli/reference.mdx` (`lightdash download` line ~790, `lightdash upload` line ~947) and the two `--organization` examples need the theme mentions added, pointing at the chosen home. |
| 6 | Adds theme editing to what the agent skills can do, plus a worked example prompt | `03a8b38` — `guides/developer/agent-skills.mdx` | `workflow/install-agent-skills.mdx` § "Using skills with your agent" (bullet after line 105) and § "Example prompts" (after line 119) | `port` | Rewrite the theme link to row 5's destination. Main's example prompt uses a bare fence; the surrounding blocks on this page do too — give the new one a language (`text`) rather than matching the existing defect. |
| 7 | Node example output reads 24 instead of 20.8.0 | `27ba2f4` — `get-started/setup-lightdash/get-project-lightdash-ready.mdx`, `guides/cli/how-to-install-the-lightdash-cli.mdx` | `workflow/cli/install.mdx:68` and `get-started/quickstart/get-project-lightdash-ready.mdx:64` | `split` | **Main's change is incomplete on both pages.** It updates the prose ("should output something like `24.0.0`") but leaves the code-block comment two lines up reading `# v20.8.0` (`workflow/cli/install.mdx:41`, `get-started/quickstart/get-project-lightdash-ready.mdx:37`). Fix both lines on both pages on the way in — otherwise we ship the version fact stated two different ways on one page. Separately: the whole Node install block is byte-identical across these two pages and is a principle-5 snippet candidate; worth flagging to the manager agent as follow-up rather than doing it here. `get-started/quickstart/...` may be another cluster's page — coordinate. |
| 8 | Expands the direct binary install path: macOS-only (arm64/x64 assets), binaries bundle their own Node runtime, `uname -m` → download → extract → `chmod` → move onto `PATH`, and steers Linux to npm / Windows to WSL | `39e5a7e` — `guides/cli/how-to-install-the-lightdash-cli.mdx` | `workflow/cli/install.mdx` § "Download binary directly" (line 284) and the intro line 18 | `port` | Clean port; the branch's install page is unchanged from `BASE` in both spots. All three anchors the new `<Info>` block links (`#install-via-homebrew`, `#install-via-npm`, `#install-on-windows-wsl-recommended`) exist on the branch page. |
| 9 | CI workflows run Node 24 on `actions/checkout@v6` and `actions/setup-node@v6` | `f2261d1` — `.github/workflows/fix-image-locations.yml`, `.github/workflows/validate-docs.yml` | same paths | `port` | The refactor touched nothing under `.github/`, so this applies verbatim. **`fix-image-locations.yml` is safe after the image move** — I ran `node scripts/check-image-locations.js` against the branch and it reports no issues; the script derives the expected directory from each page's own path (`images/<page-path-without-ext>/`), so it followed the reorg automatically. Two cosmetic staleness spots to fix while in there: the PR-comment example at `fix-image-locations.yml:132` and the header comment at `scripts/check-image-locations.js:8` both cite `guides/dashboard.mdx` → `images/guides/dashboard/`, and `guides/` no longer exists. Use a live page, e.g. `workflow/content-as-code.mdx` → `images/workflow/content-as-code/`. |
| 10 | Documents `ALLOW_DBT_COMMANDS_ACCESS_TO_ENV_VARS` — comma-separated allowlist of server env vars forwarded to the dbt subprocess for `env_var()` lookups | `1692362` — `self-host/customize-deployment/environment-variables.mdx` | `self-host/customize-deployment/environment-variables.mdx`, new `## dbt` section | `port` | **Owned by cluster-selfhost** — reporting placement only. Not a snippet: the refactor's snippet extraction (`9ffd41d`) only pulled tables that appear on both the env-vars page *and* a companion how-to (`headless-browser-env`, `logging-env`, `mcp-env`, `nats-worker-config`, `prometheus-env`, `smtp-env`). There is no self-host dbt page, so this is a single-home fact and stays inline (principle 5 needs 2+ pages). No conflict with `workflow/cli/reference.mdx` § "dbt Configuration" — that section is CLI-side (`DBT_PROJECT_DIR`, `DBT_PROFILES_DIR`), this one is server-side. Main's markdown table separator row is malformed (missing the space before the closing pipe); reformat per the table style rule. |
| 11 | Documents organization users and groups as code, the `## Organization content as code` umbrella section, `lightdash upload --send-invites`, and the reworked `--organization` flag descriptions | `a57c11e` — `guides/developer/dashboards-as-code.mdx`, `references/lightdash-cli.mdx`, `references/workspace/custom-roles.mdx` | `workflow/content-as-code.mdx`, `workflow/cli/reference.mdx`, `workspace-admin/custom-roles.mdx` | `decide` | **Not in my assigned commit list, but it lands squarely in my pages and rows 3, 4, and 5 depend on it.** Nobody appears to own it. It is the largest single delta to `workflow/content-as-code.mdx` (+184 lines) and it introduces the `## Organization content as code` umbrella that main's theme section (row 5) and custom-roles edit hang off. Recommend assigning it to this cluster or to whoever owns `workspace-admin/`; if it is dropped, rows 3 and 5 need rewording so they don't reference sections that never landed. |

## Flags

- **Row 1, the doc-type call (recommendation, not a blocker).** `workflow/content-as-code.mdx` is
  `doc-type: reference` and 6,315 words — already past the ~3,000-word size-review trigger before
  we add anything. Main's migration content is a prerequisites-then-numbered-steps walkthrough
  that re-teaches `lightdash login` and `lightdash config set-project`, which is the Tutorial form
  contract and the opposite of the Reference one. Adding it as a section is type drift (principle
  3) on a page that already needs a size review (principle 10). Recommend the standalone Tutorial;
  it also gives the "how do I copy a dashboard to another project" question a nav entry, which it
  currently doesn't have.
- **Row 5 is a genuine cross-area decision** and I've written it up as `decide` rather than
  guessing. It also exposes a **pre-existing branch duplication**: the custom-roles-as-code YAML
  contract is stated twice, in full, at `workflow/content-as-code.mdx:833-904` and
  `workspace-admin/custom-roles.mdx:239-329` — same YAML example, same upsert semantics. That's a
  principle-1 violation the refactor carried in, and whichever way row 5 goes we're about to build
  a second org-scoped resource on top of the pattern. Worth fixing in the same pass: contract in
  `workflow/content-as-code.mdx`, feature pages link.
- **`data-apps/customize-themes.mdx` has a names-are-one-contract problem** (principle 6):
  `doc-type: tutorial` with slug `customize-themes` but `title: "Themes"`. Pre-existing on the
  branch, but row 5 touches the page — retitle to "Customize themes" while we're there.
- **Row 11 is unassigned work in my pages.** Flagging for routing, not claiming it.
- **Main's own defects to not port verbatim:** the half-updated Node version (row 7), the
  malformed env-var table separator (row 10), and the bare code fence in the agent-skills prompt
  (row 6). Separately, `03a8b38` spends several hunks repairing unclosed code fences in
  `references/lightdash-cli.mdx` — **`drop` those hunks**: the refactor already fixed every one of
  them in `workflow/cli/reference.mdx` (verified at the download `--agents` and upload
  `--organization` examples, lines ~885 and ~1042).
- **`278b3ac`'s underlying fact is already on the branch** — `--strip-pivot-series` is documented at
  `workflow/content-as-code.mdx:149-161` (§ "Make downloaded charts portable across projects") and
  referenced again at line 292. Only its *use in the migration steps* ports (into row 1); do not
  re-document the flag.
- **Pre-existing, out of scope, noting so it isn't mistaken for a port error:** the `lightdash
  upload` agent example at `workflow/cli/reference.mdx:1030` shows a bare `lightdash upload` under
  the heading "Upload every AI agent file under `lightdash/ai-agents/`". That's inherited verbatim
  from `BASE`, not something the refactor or `main` introduced.

## Proposed commits

1. `docs(workflow): add dashboard migration tutorial` — rows 1, 2.
   New Tutorial page + `docs.json` nav entry, plus the inclusion table landing on
   `workflow/content-as-code.mdx`.
2. `docs(workflow): document data app CLI commands and theme-as-code` — rows 3, 4, 5, 6.
   Blocked on row 5's `decide` and coordinated with cluster-dataapps (`82588be`'s `apps create` /
   `apps preview` sections must land in the same change) and row 11.
3. `docs(workflow): expand CLI install with direct binary download` — rows 7, 8.
   Row 7's `get-started/` half may need to fold into another cluster's commit instead.

Plus one infra commit kept out of the docs series: `chore(ci): update workflow Node runtime to 24`
— row 9, including the two stale `guides/` path examples.

Row 10 belongs in cluster-selfhost's env-vars commit.
