#!/usr/bin/env python3
"""Docs IA audit: inventory, nav integrity, link hygiene, stubs, duplicate code blocks,
doc-type declarations, size/sectional review triggers, and exception-log suppression.

Usage: python3 ia-audit.py [output-dir]   (default: ./ia-audit/_audit)
Intended long-term home: .mintlify/ia-audit.py, run by periodic cleanup agents.
"""
import hashlib
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent if (Path(__file__).resolve().parent.name == "ia-audit") else Path.cwd()
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else REPO / "ia-audit" / "_audit"
OUT.mkdir(parents=True, exist_ok=True)
SKIP_DIRS = {"images", "logo", "scripts", "node_modules", ".git", "ia-audit", ".mintlify"}
STUB_WORDS = 150
SIZE_WORDS = 3000
GROUP_CHILDREN = 12
VALID_DOC_TYPES = {"tutorial", "guide", "reference"}
TAG_DOC_TYPE = {"Tutorial": "tutorial", "Guide": "guide"}
LIFECYCLE_TAGS = {"Experimental", "Beta"}

docs_json = json.loads((REPO / "docs.json").read_text())

nav_pages = []
group_sizes = []  # (breadcrumb, direct child count) for every group/subgroup node

def walk(pages, crumb):
    for p in pages:
        if isinstance(p, str):
            nav_pages.append((p, crumb))
        elif isinstance(p, dict) and "pages" in p:
            sub = crumb + [p.get("group", "?")]
            group_sizes.append((" > ".join(sub), len(p["pages"])))
            walk(p["pages"], sub)

for tab in docs_json["navigation"]["tabs"]:
    crumb = [f"tab:{tab['tab']}"]
    for g in tab.get("groups", []):
        if "pages" in g:
            sub = crumb + [g["group"]]
            group_sizes.append((" > ".join(sub), len(g["pages"])))
            walk(g["pages"], sub)
    if "pages" in tab:
        walk(tab["pages"], crumb)

nav_set = {p for p, _ in nav_pages}
nav_dupes = sorted({p for p, _ in nav_pages if sum(1 for q, _ in nav_pages if q == p) > 1})
redirects = docs_json.get("redirects", [])
redirect_map = {r["source"].lstrip("/"): r["destination"].lstrip("/") for r in redirects}

FM_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
LINK_RE = re.compile(r"\]\((/[^)#\s]*)")
HREF_RE = re.compile(r"href=[\"'](/[^\"'#]*)")
FENCE_RE = re.compile(r"^```[\w-]*\n(.*?)^```", re.DOTALL | re.MULTILINE)

pages = {}
for f in sorted(REPO.rglob("*.mdx")) + sorted(REPO.rglob("*.md")):
    rel = f.relative_to(REPO)
    if rel.parts[0] in SKIP_DIRS or rel.name == "README.md":
        continue
    slug = str(rel).removesuffix(".mdx").removesuffix(".md")
    text = f.read_text(encoding="utf-8")
    m = FM_RE.match(text)
    body = text[m.end():] if m else text
    fm = dict(re.findall(r"^(\w[\w-]*):\s*[\"']?(.*?)[\"']?\s*$", m.group(1), re.M)) if m else {}
    links = sorted({t.lstrip("/").rstrip("/") for t in
                    set(LINK_RE.findall(text)) | set(HREF_RE.findall(text))
                    if not t.startswith("//") and not t.startswith("/images")})
    blocks = [b.strip() for b in FENCE_RE.findall(body) if len(b.strip().splitlines()) >= 3]
    pages[slug] = {
        "words": len(re.findall(r"\S+", body)),
        "title": fm.get("title", ""), "description": fm.get("description", ""),
        "doc_type": fm.get("doc-type", ""), "tag": fm.get("tag", ""),
        "links": links, "blocks": blocks, "in_nav": slug in nav_set,
        "scaffold": bool(re.search(r"TODO|FIXME|NEEDS REWRITING|FLAGGED FOR REVIEW|Coming soon|GLITCH-\d+", body, re.I)),
    }

report = ["# IA audit report", ""]

def section(title, items, fmt=lambda x: f"- {x}"):
    report.append(f"## {title} ({len(items)})")
    report.extend(fmt(i) for i in items)
    report.append("")

def load_exceptions(path=REPO / ".mintlify" / "audit-exceptions.md"):
    """Parse the | path | check | snapshot | date | rationale | table into {(path, check): snapshot}."""
    if not path.exists():
        return {}
    rows = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) != 5:
            continue
        p, check, snapshot, _date, _rationale = cells
        if p.lower() == "path" or set(p) <= set("-: "):
            continue
        try:
            rows[(p, check)] = float(snapshot)
        except ValueError:
            continue
    return rows

exceptions = load_exceptions()

def fmt_num(x):
    return str(int(x)) if x == int(x) else str(x)

def gated(flags, check, in_bounds):
    """Split (metric, path) flags against the exceptions log.

    Returns (kept, suppressed_count, outdated) where outdated entries have a
    matching exception whose snapshot no longer covers the current metric.
    """
    kept, suppressed, outdated = [], 0, []
    for metric, path in flags:
        snap = exceptions.get((path, check))
        if snap is None:
            kept.append((metric, path))
        elif in_bounds(metric, snap):
            suppressed += 1
        else:
            outdated.append((path, check, snap, metric))
            kept.append((metric, path))
    return kept, suppressed, outdated

def section_gated(title, kept, suppressed, fmt=lambda x: f"- {x}"):
    tail = f", {suppressed} suppressed by exceptions" if suppressed else ""
    report.append(f"## {title} ({len(kept) + suppressed}{tail})")
    report.extend(fmt(i) for i in kept)
    report.append("")

section("Nav entries pointing at missing files", sorted(nav_set - set(pages)))
snippet_slugs = {s for s in pages if s.startswith("snippets/")}
section("Orphans (on disk, not in nav, not snippets)",
        sorted(s for s in pages if not pages[s]["in_nav"] and s not in snippet_slugs))
section("Pages in nav more than once", nav_dupes)

broken, via_redirect = [], []
for slug, p in pages.items():
    for t in p["links"]:
        if t in pages or t.startswith("api-reference") or t.startswith("snippets"):
            continue
        (via_redirect if t in redirect_map else broken).append(f"{slug} -> {t}")
section("Broken internal links", sorted(broken))
section("Internal links routed through redirects (update to final URL)", sorted(via_redirect))

chains = [f"{s} -> {d} -> {redirect_map[d]}" for s, d in redirect_map.items() if d in redirect_map]
section("Redirect chains (must be flattened)", chains)

stubs = sorted((p["words"], s) for s, p in pages.items()
               if p["in_nav"] and p["words"] < STUB_WORDS)
section(f"Stub candidates (<{STUB_WORDS} words, in nav — merge or justify)",
        stubs, lambda x: f"- {x[1]} ({x[0]}w)")

section("Shipped scaffolding (TODO/draft/Coming-soon markers)",
        sorted(s for s, p in pages.items() if p["scaffold"]))

section("Missing frontmatter description",
        sorted(s for s, p in pages.items() if p["in_nav"] and not p["description"]))

invalid_doc_types, tag_mismatches = [], []
for slug, p in pages.items():
    dt, tag = p["doc_type"], p["tag"]
    if dt and dt not in VALID_DOC_TYPES:
        invalid_doc_types.append(f"{slug} (doc-type: {dt})")
    if tag and tag not in TAG_DOC_TYPE and tag not in LIFECYCLE_TAGS:
        tag_mismatches.append(f"{slug} (tag: {tag} is not a valid tag value)")
    elif tag in TAG_DOC_TYPE and dt != TAG_DOC_TYPE[tag]:
        tag_mismatches.append(f"{slug} (tag: {tag} requires doc-type: {TAG_DOC_TYPE[tag]}, found: {dt or 'none'})")
section("Invalid doc-type values", sorted(invalid_doc_types))
section("Tag / doc-type mismatches", sorted(tag_mismatches))

size_flags = sorted((p["words"], s) for s, p in pages.items()
                    if p["in_nav"] and p["words"] > SIZE_WORDS)
size_kept, size_suppressed, size_outdated = gated(
    size_flags, "Size review", lambda cur, snap: cur < snap * 1.1)
section_gated("Size review", size_kept, size_suppressed, lambda x: f"- {x[1]} ({x[0]}w)")

sectional_flags = sorted((n, b) for b, n in group_sizes if n > GROUP_CHILDREN)
sectional_kept, sectional_suppressed, sectional_outdated = gated(
    sectional_flags, "Sectional review", lambda cur, snap: cur <= snap)
section_gated("Sectional review", sectional_kept, sectional_suppressed,
             lambda x: f"- {x[1]} ({x[0]} children)")

outdated = size_outdated + sectional_outdated
report.append(f"## Outdated exceptions — re-review ({len(outdated)})")
report.extend(f"- {path} [{check}]: snapshot={fmt_num(snap)}, current={fmt_num(cur)}"
             for path, check, snap, cur in outdated)
report.append("")

block_index = defaultdict(list)
for slug, p in pages.items():
    for b in p["blocks"]:
        block_index[hashlib.sha1(b.encode()).hexdigest()[:12]].append(slug)
dups = {h: sorted(set(s)) for h, s in block_index.items() if len(set(s)) > 1}
report.append(f"## Identical code blocks in 2+ pages ({len(dups)}) — snippet candidates")
for h, slugs in sorted(dups.items(), key=lambda kv: -len(kv[1])):
    report.append(f"- {' | '.join(slugs)}")
report.append("")

inbound = defaultdict(int)
for slug, p in pages.items():
    for t in p["links"]:
        inbound[t] += 1
lonely = sorted(s for s, p in pages.items()
                if p["in_nav"] and inbound[s] == 0 and p["words"] > 400)
section("Substantial pages with zero inbound links (cross-linking gaps)", lonely)

(OUT / "report.md").write_text("\n".join(report))
issues = (sum(len(v) for v in [broken, via_redirect, chains, nav_dupes, stubs]) + len(dups)
          + len(invalid_doc_types) + len(tag_mismatches) + len(size_kept) + len(sectional_kept))
print(f"pages={len(pages)} nav={len(nav_pages)} flagged-clusters={issues}")
print(f"report: {OUT / 'report.md'}")
