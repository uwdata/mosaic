#!/usr/bin/env bash
# Run visual tests in a Docker container matching the CI environment.
# Usage: bin/visual-test.sh [--update]
#   --update  Update snapshots instead of comparing against them.

set -euo pipefail

IMAGE="mcr.microsoft.com/playwright:v1.59.1-noble"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

ARGS=()
if [[ "${1:-}" == "--update" ]]; then
  ARGS+=("--update-snapshots")
  shift
fi

RUNTIME="${CONTAINER_RUNTIME:-docker}"

exec "$RUNTIME" run --rm -it \
  -e COREPACK_ENABLE_AUTO_PIN=0 \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -v "$REPO_ROOT":/workspace \
  -w /workspace \
  "$IMAGE" \
  bash -c "corepack enable && pnpm install --frozen-lockfile && pnpm -F @uwdata/mosaic-spec test:visual ${ARGS[*]:-}"
