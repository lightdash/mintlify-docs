# Docs reorganization plan

Prepared 2026-07-28 from a full-corpus audit (218 pages, every page read). Companion artifacts in this directory:

| File | Contents |
| --- | --- |
| `tree-map.md` | Current-state tree: every page annotated with type, audience, gist, overlaps, flags |
| `move-map.csv` | Per-page disposition: old slug → action (keep/move/merge/split/delete) → new slug, doc-type, redirect flag, notes |
| `redirects-draft.json` | 188 new redirect entries + 62 existing redirects re-pointed to final URLs |
| `ia-rules.md` | Durable IA rules — the system this plan installs; lands at `.mintlify/ia-rules.md`, linked from `AGENTS.md` |
| `ia-audit.py` | Audit script: nav/link integrity, stubs, size and sectional reviews, doc-type checks, exception-log suppression, duplicate code blocks; lands at `.mintlify/ia-audit.py` |

## Why reorganize

The corpus is mechanically healthy (zero broken links, no missing nav files) but structurally drifted:

1. **The `guides/` vs `references/` path taxonomy has collapsed.** Directories no longer predict content type: `guides/filters` is a reference, `references/workspace/` holds seven how-tos, and the 65 accumulated redirects show pages ping-ponging between the two for years. Every new page faces an ambiguous placement decision, and agents guess differently each time.
2. **Duplication instead of linking, and it has already caused fact drift.** The same content is written out 2–5 times in ~30 clusters (formatting tables ×3, parameters schema ×3, strict-compilation flags ×4, CLI install ×3, env-var tables ×11 pages…). Where copies exist, they have diverged: browserless version, scheduler CPU sizing, `NATS_ENABLED` semantics, and the FAQ destination all contradict themselves across pages today.
3. **Audience mixing.** `references/workspace/` files everyday user features (spaces, pinning, personal tokens) alongside org governance (SCIM, SSO, custom roles).
4. **Naming drift.** Several pages have three different names (slug vs title vs sidebar), two adjacent nav levels both say "Overview", and "MCP servers" vs "Lightdash MCP" name opposite features.
5. **Debris.** ~15 stubs (some "Coming soon"), a dead snippet component, a draft with internal review scaffolding at repo root, one page in nav twice, a deprecated section kept alongside its replacement.

## Target structure

**Paths encode product area; doc type is a page property, never a directory.** Product areas are stable (features rarely change area; they often change doc type), which is what makes this the durable choice. Doc types (Tutorial / Guide / Reference / plain docs) are defined in `ia-rules.md`; every page's type is the `doc_type` column of move-map.csv — 76 tutorials (verb-first slugs), 5 guides (noun-phrase), 107 references, 31 plain docs.

```text
introduction              Landing; gains a short "consume these docs over MCP" section
get-started/              quickstart (+ connect-project, get-project-lightdash-ready,
                          invite-new-users below it), explore-your-data/ (explorer track),
                          build-your-semantic-layer/ (developer track), lightdash-way (Guide)
explore/                  BI consumption: chart-types/, filter-your-data, table-calculations/,
                          metrics-catalog/, dashboards, create-alerts, create-scheduled-deliveries,
                          spaces, pin-content, formatting, create-custom-fields, sql-runner,
                          date-zoom, version-history, keyboard-shortcuts…
semantic-layer/           The modeling language: metrics, dimensions, tables, joins, parameters,
                          explores, virtual-views, sql-variables, lightdash-config-yml,
                          writing-descriptions (Guide), caching, pre-aggregates/,
                          dbt/ (projects, metricflow, modeling-strategies, write-back, migrations)
workflow/                 The software lifecycle around your project: cli/ (install, authenticate,
                          generate, deploy, validate, lint, compile, reference), set-up-ci-cd,
                          preview-projects, pull-requests, content-as-code, set-up-vs-code,
                          install-agent-skills, edit-dashboards-with-agents,
                          rename-models-and-fields, validating-your-content
agents/                   Lightdash Agents: set-up-agents, use-ai-agents, data-access,
                          verified-answers, create-evaluation-suites, agent-memory, agents-as-code,
                          lightdash-mcp, connect-external-mcp-servers, ai-writeback,
                          effective-analytics-with-agents (Guide)…
data-apps/                create-visualizations, customize-themes, external-connections, self-hosting
embed/                    set-up-embedding, per-surface tutorials (embed-charts, embed-dashboards,
                          embed-ai-agents, embed-data-apps, embed-metrics-catalog), reference,
                          iframe, react-sdk
integrations/             slack, sync-google-sheets, metrics-sql-api, snowflake-cortex
workspace-admin/          Org governance: roles, custom-roles, manage-groups, user-attributes,
                          scim-integration, sso/, service-accounts, manage-your-organization,
                          manage-projects, instance-health (Guide), set-project-timezone
personal-settings/        create-personal-tokens, personal-warehouse-connections, timezone
self-host/                (paths unchanged; content fixes only)
api-reference/            (unchanged; OpenAPI-generated — remains the only tab besides Docs)
help/                     support, generate-har-file, feature-maturity-levels
snippets/                 Shared transcluded content (grows substantially — see directives)
```

Navigation: two tabs (**Docs**, **API**). The `dbt guides` tab dissolves into `semantic-layer/dbt/`; the python SDK joins the API tab under an "SDKs" group. Every top-level area group sets `root` (its landing page, at the bare area slug) and `directory: "card"` — landings are a short orientation plus the auto-rendered child directory, "Overview" disappears as a sidebar item, and hand-built card grids are retired. Every page appears in exactly one nav position; `move-map.csv` is authoritative.

## Consolidation directives

Each directive names the **canonical home** for a piece of content; all other appearances become links or snippet transclusions. Mechanism key: *snippet* = identical text transcluded from `snippets/`; *link* = summary sentence + link to canonical.

### Shared-content extraction (create snippets)

| # | Content | Canonical / snippet | Currently duplicated in |
| --- | --- | --- | --- |
| D1 | Field format/compact/separator tables | `snippets/field-formatting-options` | semantic-layer/metrics, dimensions; explore/formatting-your-fields keeps the walkthrough and links |
| D2 | Parameters property schema | `semantic-layer/parameters` (page) | tables, lightdash-config-yml → link |
| D3 | Strict-compilation flags (`--no-partial-compilation`, `--validate-warehouse-columns`) | `snippets/strict-compilation-flags` | workflow/cli/deploy, validate, lint, reference |
| D4 | Granularity label placeholder + date-zoom warning | `snippets/granularity-placeholder` | pie, funnel, gauge, big-value chart pages, configure-charts |
| D5 | Per-feature env-var tables | `self-host/customize-deployment/environment-variables` stays the full catalog; each feature's table becomes a `snippets/self-host/<feature>-env` transcluded in **both** the catalog and the feature page. Image versions (browserless etc.) are never pinned in prose — flag pinning for the automation project | 11 self-host pages, several already drifted |
| D6 | dbt field-tagging YAML examples | `agents/data-access` | agents/set-up-agents → link |
| D7 | "What are Tables?" + dbt tag/selector examples | `snippets/tables-intro-selectors` | get-started/quickstart/get-project-lightdash-ready, get-started/build-your-semantic-layer/add-tables-to-lightdash |
| D8 | Slack/Teams delivery-destination setup | `snippets/delivery-destinations` | explore/create-scheduled-deliveries, explore/create-alerts |
| D9 | "How impersonation works" (audit logging, warehouse-credential interaction) | `snippets/impersonation-mechanics` | workspace-admin/user-impersonation, workspace-admin/support-access |
| D10 | NATS worker config block | `snippets/self-host/nats-worker-config` | nats-workers/warehouse-workers, pre-aggregate-workers |

### Merges and splits (page count changes; all in move-map.csv)

- D11 `agents` landing ← merge of guides/ai-overview + guides/choosing-ai-workflow as a "choosing your AI surface" section (one comparison table, one decision guide); the `data-apps` landing links to it.
- D12 `workflow/cli/install` absorbs how-to-upgrade-cli (redirect to `#updating-the-lightdash-cli`).
- D13 `workflow/preview-projects` absorbs guides/cli/how-to-use-lightdash-preview (CLI usage becomes a section).
- D14 `workflow/content-as-code` ← dashboards-as-code renamed and split: virtual-views section → `semantic-layer/virtual-views` (which absorbs the 150-word stub); VS Code section + vs-code-yaml-validation → `workflow/set-up-vs-code`; disposable-editing section → link to `workflow/edit-dashboards-with-agents` (canonical); custom-roles-as-code stays here, workspace-admin/custom-roles links.
- D15 `integrations/slack` ← slack-integration reference + adding-slack-integration (install section) + using-slack-integration (usage section). Self-host Slack-app config stays separate (platform audience).
- D16 `self-host/upgrading` ← update-lightdash + upgrading-lightdash-versioning + the checklist's upgrade guidance (mechanics, cadence policy, migration job, rollback — currently scattered and partly contradictory).
- D17 `self-host/customize-deployment/scheduler` ← configure-standalone-scheduled-worker renamed; the "Coming soon" enable-scheduler stub is deleted and redirected here.
- D18 `explore/chart-types/bar-chart` absorbs horizontal-bar-chart as a section.
- D19 `help/support` ← contact-info + faqs, rewritten to the support-routing decision: community OSS users → `#help` in the community Slack; customers → their support Slack channel or in-app help bubble; GitHub Issues for bugs and feature requests. No mention of GitHub Discussions, the Pylon FAQ, or Pylon itself (it is the internal queue, not a user surface).
- D20 `workspace-admin` landing ← references/admin rewritten as the area landing (root + directory:card).
- D21 Timezones ships as two pages: `workspace-admin/set-project-timezone` (warehouse column types, project timezone setting, conversion overrides) and `personal-settings/timezone` (per-chart resolution priority, DST behavior, troubleshooting). timezones-draft merges into the personal page; strip all GLITCH-NNN / NEEDS-REWRITING scaffolding; delete the root draft after merge.
- D34 `introduction` gains a short closing section: these docs are consumable over Mintlify's hosted MCP endpoint — three sentences and the URL, no auth required.
- D35 `semantic-layer/dbt/projects` gains a "dbt packages" section (utils and audit-helper for expanded testing and migration, package-lock basics) absorbing dbt-package-lock.
- D36 Missing area landings are created as new root+directory pages: explore, workflow (with the lifecycle charter), embed, help, personal-settings, self-host, get-started. Existing pages carry the rest (agents, data-apps, semantic-layer, integrations, workspace-admin, and the section landings chart-types, pre-aggregates, sso, nats-workers).

### Canonicalization without merging (trim one side to a link)

- D22 Caching vs pre-aggregates comparison: canonical in `semantic-layer/caching`; the pre-aggregates landing links. Filtered-pre-aggregate worked example: canonical in pre-aggregates/getting-started; the landing links.
- D23 "When validation runs": canonical in `workflow/validating-your-content`; workflow/cli/validate links.
- D24 GitHub Actions / CI secrets setup: canonical in `workflow/set-up-ci-cd` (its own tutorial — the CLI is a tool CI/CD uses, not its parent); workflow/cli/compile and reference link.
- D25 Space-roles table: canonical in `workspace-admin/roles`; explore/spaces links (drop the prose re-description).
- D26 SSO cluster: `workspace-admin/sso` (landing: providers + availability; states the verified-domain prerequisite once), `sso/setup` (steps), `sso/verified-domains` (canonical routing mechanic). Each states its own job; no restated framing.
- D27 `ai_hint` guidance: canonical in `semantic-layer/writing-descriptions` (a Guide); agents/effective-analytics-with-agents links. Same page: its restatements of verified-answers and evaluations become links.
- D28 Enterprise license keys: canonical in customize-deployment/enterprise-license-keys; enterprise-on-prem links.
- D29 Table-calculation patterns: canonical in `explore/table-calculations/formulas`; every SQL-template recipe and explore/compare-periods must link the native function that supersedes its pattern. (Optional later: fold templates into per-pattern pages with Formula/SQL tabs.)
- D30 Embedding: `embed/set-up-embedding` canonical for setup steps (the per-surface tutorials link); tutorial↔reference mirroring is the codified pattern — the tutorial owns walkthrough + worked example, the reference owns exhaustive token/prop schema.
- D31 production-deployment-checklist becomes a true index: it may summarize, but every fact's canonical home is the dedicated page (move the HTTPS `SECURE_COOKIES`/`TRUST_PROXY` rationale into secure-lightdash-with-https; likewise pgvector/HA guidance into the external-database page).
- D32 Deprecated Okta-groups section in workspace-admin/manage-groups: delete, link scim-integration's group-provisioning section.
- D33 MCP naming: `agents/lightdash-mcp` (external assistants calling in — in nav exactly once, killing the current duplicate entry) vs `agents/connect-external-mcp-servers` (Lightdash agents calling out). Titles must state the direction.

### Deletions

- `snippets/checklist.jsx` — zero imports anywhere.
- `enable-scheduler-in-self-hosted-lightdash` and all merged-away pages — redirected per move-map.csv.

## Execution plan

Run as four phases; each is independently landable. **Phase 1 before Phase 2**: consolidation edits are judgment work and are much easier to review inside the stable target skeleton; moves are mechanical and script-verifiable.

### Phase 0 — verify and prep (small)

1. Create `.mintlify/`: land `ia-rules.md` and `ia-audit.py` there; link both from `AGENTS.md` so our agents and Mintlify's agent share one system. Seed an empty `audit-exceptions.md`.
2. Confirm the pending-engineering answers below with engineering (not blocking — plausibility picks are already applied).
3. Test whether Mintlify honors `#anchor` fragments in redirect destinations (one entry in preview); merge-target redirects use anchors only if so.

### Phase 1 — skeleton migration (one PR, mechanical)

1. `git mv` every `move`/`split` row in move-map.csv old → new.
2. Apply doc-type frontmatter from the CSV's `doc_type` column: `doc-type` on every typed page, plus `tag: Tutorial` / `tag: Guide` pills (lifecycle badges like `Beta` keep the slot where present).
3. Rewrite `docs.json`: new nav tree with `root` + `directory: "card"` per area, append the 188 new redirects, apply the 62 destination re-points from redirects-draft.json (Mintlify does not chain redirects — every source must point at a final URL).
4. Rewrite all internal links to final URLs (script the substitution from move-map.csv).
5. Verify: `ia-audit.py` reports zero orphans/broken links/nav dupes; `mint broken-links` passes; spot-check 10 redirects in preview.

Merges and deletes also land here as pure page-level operations (move content wholesale into target, redirect) — content *rewriting* waits for Phase 2.

### Phase 2 — consolidation (one workstream per cluster, parallelizable)

Execute the directives as eight independent workstreams, each a reviewable PR: (a) workflow + CLI, (b) semantic layer + dbt, (c) explore/BI, (d) agents + data-apps, (e) embed + integrations, (f) workspace-admin + personal-settings, (g) self-host, (h) get-started + help (quickstart golden-path rewrite, track landings, D19, D34). Per directive, order of operations: make the canonical page whole first (pull in the best content from all copies), then trim the other copies to links/snippets. Never delete a fact that exists nowhere else.

### Phase 3 — backlog (optional, prioritize separately)

Expansions: introduction (define or drop "Context Layer"), explore/keyboard-shortcuts (documents 3 shortcuts today), personal-settings/create-personal-tokens (lifecycle/rotation/expiry), explore/filter-dashboard-by-url (text to match the Looms), migrate-to-fusion (CLI compatibility statement), secure-lightdash-with-https. Structural: split quickstart/connect-project (~9,000 words) into per-warehouse pages; split scim-integration into setup + reference; fold SQL templates into formula pages with tabs. Editorial: refresh The Lightdash Way as the model Guide under the new terminology.

## Redirect and link-integrity strategy

- `docs.json` `redirects` is the mechanism (65 already in production here).
- Every changed URL in move-map.csv has a redirect entry in redirects-draft.json; merge targets redirect to the page (with `#anchor` only after the Phase 0 test passes).
- Existing redirects are re-pointed, never chained; 3 remain untouched.
- Internal links always point at final URLs. `ia-audit.py` flags links that resolve only via redirect.
- External breakage is bounded to deep links into anchors of merged pages; everything else lands via redirect.

## Maintenance systems (recommendations — implement as the fast-follow project)

Three layers, from tightest scope to broadest:

1. **Mintlify agent — patch profile only.** Its pre-write search is Mintlify's own site search plus the rules; it is not the dedup backstop (volume already proved it can't be).
2. **Local sessions — qmd over MCP.** [qmd](https://github.com/tobi/qmd) (MIT; Node ≥22; ~2GB local GGUF models on first run) gives hybrid BM25 + vector + reranked RRF search over the corpus with a built-in MCP server. Pre-write duplication checks become real queries, and its similarity search catches the paraphrase drift that hash-based checks miss — the class behind every fact-drift incident found in this audit.
3. **Daily scheduled audit — Claude Managed Agents.** Runs `ia-audit.py` plus a qmd near-duplicate sweep on a daily schedule, files small per-cluster PRs per the cleanup profile, resolves or logs exceptions. This backstop is what lets layer 1 stay tight.

### Verifications (carry into the automation project)

- `mint` CLI is on PATH locally; `mint broken-links` passes on the current corpus.
- `ia-audit.py` runs clean end-to-end (exceptions parsing self-tested for suppression and outdated-detection).
- Redirect anchor behavior: untested — Phase 0 item.
- Mintlify page-level `tag` frontmatter and group `root`/`directory` properties confirmed against current Mintlify docs.

## Pending engineering confirmation

Plausibility picks applied so nothing blocks; confirm and correct in place if wrong.

1. **Scheduler CPU: picked 500m** (the scheduler orchestrates while workers execute; "1" reads like a rounded copy). If wrong: fix `self-host/customize-deployment/scheduler`.
2. **`NATS_ENABLED`: picked query-execution offload** (the nats-workers semantics; the env-var catalog line is the likelier stale copy). If wrong: fix the catalog row and `self-host/nats-workers`.
3. **dbt Fusion: picked "not yet officially verified; dbt Core supported"** (docs underclaim until engineering confirms). If wrong: update `semantic-layer/dbt/migrate-to-fusion`.
4. **timezones GLITCH-NNN markers**: each unresolved item in timezones-draft needs engineering sign-off during the D21 rewrite.
5. **Browserless version automation**: versions are unpinned in prose per D5; automation project should source them from the Dockerfile.
