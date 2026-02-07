#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install GitHub CLI first."
  exit 1
fi

REPO="${1:-Egonso/studio}"
BRANCH="${2:-main}"
shift 2 || true
CHECK_CONTEXTS=("$@")

echo "Applying branch protection for ${REPO}#${BRANCH}..."

if [ "${#CHECK_CONTEXTS[@]}" -eq 0 ]; then
  echo "No required status checks passed. Applying PR-only protection."
  gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/${REPO}/branches/${BRANCH}/protection" \
    -F required_status_checks=null \
    -f enforce_admins=true \
    -f required_pull_request_reviews.dismiss_stale_reviews=true \
    -f required_pull_request_reviews.require_code_owner_reviews=false \
    -f required_pull_request_reviews.required_approving_review_count=1 \
    -f restrictions= \
    -f allow_force_pushes=false \
    -f allow_deletions=false \
    -f required_linear_history=false \
    -f block_creations=false \
    -f required_conversation_resolution=true \
    -f lock_branch=false
else
  echo "Applying with required status checks: ${CHECK_CONTEXTS[*]}"
  GH_ARGS=(
    --method PUT
    -H "Accept: application/vnd.github+json"
    "/repos/${REPO}/branches/${BRANCH}/protection"
    -f required_status_checks.strict=true
    -f enforce_admins=true
    -f required_pull_request_reviews.dismiss_stale_reviews=true
    -f required_pull_request_reviews.require_code_owner_reviews=false
    -f required_pull_request_reviews.required_approving_review_count=1
    -f restrictions=
    -f allow_force_pushes=false
    -f allow_deletions=false
    -f required_linear_history=false
    -f block_creations=false
    -f required_conversation_resolution=true
    -f lock_branch=false
  )

  for ctx in "${CHECK_CONTEXTS[@]}"; do
    GH_ARGS+=(-F "required_status_checks.contexts[]=${ctx}")
  done

  gh api "${GH_ARGS[@]}"
fi

echo "Done. Branch protection active for ${REPO}#${BRANCH}."
