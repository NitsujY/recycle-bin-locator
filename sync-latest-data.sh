#!/usr/bin/env bash

set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE_ROOT="$(cd "$APP_DIR/.." && pwd)"
DATA_DIR="$WORKSPACE_ROOT/recycle-bin-locator-data"
SRC_JSON="$DATA_DIR/data/collection_points.json"
DST_JSON="$APP_DIR/public/collection_points.json"

INTERVAL_SECONDS="${POLL_INTERVAL_SECONDS:-900}"
WATCH_MODE=false

if [[ "${1:-}" == "--watch" ]]; then
  WATCH_MODE=true
fi

run_sync() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Refreshing dataset from live source..."
  (
    cd "$DATA_DIR"
    npm run pipeline
  )

  cp "$SRC_JSON" "$DST_JSON"

  if ! grep -q '"generatedAt"' "$DST_JSON"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sync validation failed: missing generatedAt"
    return 1
  fi

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Synced $DST_JSON"
}

if [[ ! -d "$DATA_DIR" ]]; then
  echo "Missing sibling data repository: $DATA_DIR"
  exit 1
fi

run_sync

if [[ "$WATCH_MODE" != true ]]; then
  exit 0
fi

echo "Polling every ${INTERVAL_SECONDS}s. Press Ctrl+C to stop."
while true; do
  if ! sleep "$INTERVAL_SECONDS"; then
    exit 0
  fi

  if ! run_sync; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Poll cycle failed; retrying next interval"
  fi
done
