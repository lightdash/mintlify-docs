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

normalize_handle() {
  local handle="$1"
  local lower_handle

  lower_handle="$(printf "%s" "$handle" | tr '[:upper:]' '[:lower:]')"

  case "$lower_handle" in
    tatiana|tatiana-inama)
      printf "tatianainama"
      ;;
    *)
      printf "%s" "$handle"
      ;;
  esac
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
  if response="$(gh api -X POST "repos/$DOCS_REPO/issues/$pr_number/assignees" -f "assignees[]=$author" 2>/dev/null)"; then
    if printf "%s" "$response" | jq -e --arg author "$author" '.assignees // [] | any(.login == $author)' >/dev/null; then
      return 0
    fi
  else
    echo "WARN PR #$pr_number: assignment to @$author failed, trying fallback cc comment" >&2
  fi

  local fallback_body="cc @$author"
  local has_fallback
  has_fallback="$(gh api "repos/$DOCS_REPO/issues/$pr_number/comments" --paginate --jq \
    "any(.[]; (.body // \"\" | ltrimstr(\" \") | rtrimstr(\" \")) == \"$fallback_body\")")"

  if [[ "$has_fallback" == "true" ]]; then
    return 1
  fi

  if ! gh pr comment "$pr_number" -R "$DOCS_REPO" --body "$fallback_body" >/dev/null; then
    echo "WARN PR #$pr_number: fallback cc comment for @$author failed" >&2
  fi

  return 1
}

require_command gh
require_command jq
require_command perl

prs_json="$(gh pr list -R "$DOCS_REPO" --state open --limit 200 --json number,title,body,assignees,url,author)"
count="$(printf "%s" "$prs_json" | jq 'length')"

echo "Found $count open PRs in $DOCS_REPO"
echo "Scanning open unassigned PRs only with DRY_RUN=$DRY_RUN"

printf "%s" "$prs_json" | jq -c '.[] | select((.assignees | length) == 0)' | while IFS= read -r pr; do
  number="$(printf "%s" "$pr" | jq -r '.number')"
  title="$(printf "%s" "$pr" | jq -r '.title')"
  body="$(printf "%s" "$pr" | jq -r '.body // ""')"
  pr_author="$(printf "%s" "$pr" | jq -r '.author.login // ""')"
  pr_author_is_bot="$(printf "%s" "$pr" | jq -r '.author.is_bot // false')"
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

    author="$(normalize_handle "$author")"

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
    cc_author="$(normalize_handle "$cc_author")"
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

  if [[ -n "$pr_author" && "$pr_author_is_bot" != "true" ]]; then
    pr_author="$(normalize_handle "$pr_author")"

    if [[ "$DRY_RUN" == "1" ]]; then
      echo "DRY RUN PR #$number: would assign @$pr_author from docs PR author: $title"
    elif assign_or_comment "$number" "$pr_author"; then
      echo "ASSIGNED PR #$number to @$pr_author from docs PR author: $title"
    else
      echo "FALLBACK PR #$number: assignment to @$pr_author did not stick, fallback cc exists or was posted: $title"
    fi

    continue
  fi

  echo "SKIP PR #$number: no source PR or cc mention found: $title"
done
