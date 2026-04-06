#!/usr/bin/env bash
# Scheduled matchup data update — runs on VPS via cron.
# Generates fresh data, validates, commits and pushes if changed.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="$PROJECT_DIR/logs/update-matchup-data.log"
mkdir -p "$(dirname "$LOG_FILE")"

exec > >(tee -a "$LOG_FILE") 2>&1
echo ""
echo "=== $(date -u '+%Y-%m-%d %H:%M UTC') ==="

cd "$PROJECT_DIR"

# Pull latest to avoid conflicts with manual commits
git pull --ff-only origin main

# Generate data
npm run generate-data

# Check for changes
if git diff --quiet data/; then
  echo "No changes detected — skipping commit."
  exit 0
fi

# Sanity check: no matchup JSON under 10KB
SMALL_FILES=$(find data/matchups -name '*.json' -size -10k | wc -l)
if [ "$SMALL_FILES" -gt 0 ]; then
  echo "✗ Found $SMALL_FILES matchup files under 10KB — aborting commit"
  find data/matchups -name '*.json' -size -10k -exec ls -lh {} \;
  exit 1
fi

# Commit and push
git add data/
git commit -m "data: update matchup data $(date -u +%Y-%m-%d)"
git push

echo "✓ Data updated and pushed"
