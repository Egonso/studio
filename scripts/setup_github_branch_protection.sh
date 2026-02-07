#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install GitHub CLI first."
  exit 1
fi

REPO="${1:-Egonso/studio}"
BRANCH="${2:-main}"

echo "Applying branch protection for ${REPO}#${BRANCH}..."

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/${REPO}/branches/${BRANCH}/protection" \
  -f required_status_checks.strict=true \
  -F required_status_checks.contexts[]="lint" \
  -F required_status_checks.contexts[]="typecheck" \
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

echo "Done. Branch protection active for ${REPO}#${BRANCH}."

