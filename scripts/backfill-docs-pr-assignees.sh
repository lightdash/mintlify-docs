#!/usr/bin/env bash
set -euo pipefail

DRY_RUN="${DRY_RUN:-1}"
DOCS_REPO="${DOCS_REPO:-lightdash/mintlify-docs}"
SOURCE_REPO="${SOURCE_REPO:-lightdash/lightdash}"

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    exit 1
  fi
}

resolve_source_from_text() {
  perl -0777 -ne 'if (/lightdash\/lightdash(?:#|\/pull\/)(\d+)/i) { print $1; exit } elsif (/(?:upstream PR|source PR|triggered by|follows|follow-up to)[^#]{0,120}#(\d{5,})/is) { print $1; exit }'
}

resolve_cc_from_text() {
  perl -0777 -ne 'if (/(?:^|\n)\s*cc\s+@([A-Za-z0-9-]+)/i) { print $1; exit }'
}

source_pr_author() {
  local source_number="$1"

  gh api "repos/$SOURCE_REPO/pulls/$source_number" --jq '.user.login // empty'
}

timeline_source_pr() {
  local pr_number="$1"

  gh api "repos/$DOCS_REPO/issues/$pr_number/timeline" --paginate --jq \
    "map(select(.event == \"cross-referenced\" and .source.issue.repository.full_name == \"$SOURCE_REPO\" and .source.issue.pull_request != null)) | .[-1].source.issue.number // empty"
}

assign_or_comment() {
  local pr_number="$1"
  local author="$2"

  local response
  response="$(gh api -X POST "repos/$DOCS_REPO/issues/$pr_number/assignees" -f "assignees[]=$author")"

  if printf "%s" "$response" | jq -e --arg author "$author" '.assignees // [] | any(.login == $author)' >/dev/null; then
    return 0
  fi

  local fallback_body="cc @$author"
  local has_fallback
  has_fallback="$(gh api "repos/$DOCS_REPO/issues/$pr_number/comments" --paginate --jq \
    "any(.[]; (.body // \"\" | ltrimstr(\" \") | rtrimstr(\" \")) == \"$fallback_body\")")"

  if [[ "$has_fallback" == "true" ]]; then
    return 1
  fi

  gh pr comment "$pr_number" -R "$DOCS_REPO" --body "$fallback_body" >/dev/null
  return 1
}

require_command gh
require_command jq
require_command perl

prs_json="$(gh pr list -R "$DOCS_REPO" --state open --limit 200 --json number,title,body,assignees,url)"
count="$(printf "%s" "$prs_json" | jq 'length')"

echo "Found $count open PRs in $DOCS_REPO"
echo "Scanning open unassigned PRs only with DRY_RUN=$DRY_RUN"

printf "%s" "$prs_json" | jq -c '.[] | select((.assignees | length) == 0)' | while IFS= read -r pr; do
  number="$(printf "%s" "$pr" | jq -r '.number')"
  title="$(printf "%s" "$pr" | jq -r '.title')"
  body="$(printf "%s" "$pr" | jq -r '.body // ""')"
  source_number="$(printf "%s" "$body" | resolve_source_from_text)"
  reason=""

  if [[ -n "$source_number" ]]; then
    reason="body source reference"
  else
    source_number="$(timeline_source_pr "$number")"
    if [[ -n "$source_number" ]]; then
      reason="timeline cross-reference"
    fi
  fi

  if [[ -n "$source_number" ]]; then
    author="$(source_pr_author "$source_number")"

    if [[ -z "$author" ]]; then
      echo "SKIP PR #$number: $SOURCE_REPO#$source_number has no author: $title"
      continue
    fi

    if [[ "$author" == *"[bot]" ]]; then
      echo "SKIP PR #$number: $SOURCE_REPO#$source_number author is bot $author: $title"
      continue
    fi

    if [[ "$DRY_RUN" == "1" ]]; then
      echo "DRY RUN PR #$number: would assign @$author from $SOURCE_REPO#$source_number via $reason: $title"
    elif assign_or_comment "$number" "$author"; then
      echo "ASSIGNED PR #$number to @$author from $SOURCE_REPO#$source_number via $reason: $title"
    else
      echo "FALLBACK PR #$number: assignment to @$author did not stick, fallback cc exists or was posted: $title"
    fi

    continue
  fi

  cc_author="$(printf "%s" "$body" | resolve_cc_from_text)"
  if [[ -n "$cc_author" ]]; then
    if [[ "$cc_author" == *"[bot]" ]]; then
      echo "SKIP PR #$number: cc mention is bot @$cc_author: $title"
      continue
    fi

    if [[ "$DRY_RUN" == "1" ]]; then
      echo "DRY RUN PR #$number: would assign @$cc_author from cc mention: $title"
    elif assign_or_comment "$number" "$cc_author"; then
      echo "ASSIGNED PR #$number to @$cc_author from cc mention: $title"
    else
      echo "FALLBACK PR #$number: assignment to @$cc_author did not stick, fallback cc exists or was posted: $title"
    fi

    continue
  fi

  echo "SKIP PR #$number: no source PR or cc mention found: $title"
done
