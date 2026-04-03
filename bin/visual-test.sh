#!/usr/bin/env bash
# Run visual tests in a Docker container matching the CI environment.
# Usage: bin/visual-test.sh [--update] [playwright args...]
#   --update           Update snapshots instead of comparing against them.
#   -g "axes|bias"     Pass extra args to playwright (e.g. grep filter).

set -euo pipefail

IMAGE="mcr.microsoft.com/playwright:v1.59.1-noble"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

ARGS=()
if [[ "${1:-}" == "--update" ]]; then
  ARGS+=("--update-snapshots")
  shift
fi
ARGS+=("$@")

RUNTIME="${CONTAINER_RUNTIME:-docker}"

CMD="corepack enable && pnpm install --frozen-lockfile && pnpm run build && pnpm -F @uwdata/mosaic-spec test:visual"
for arg in "${ARGS[@]}"; do
  CMD+=" $(printf '%q' "$arg")"
done

exec "$RUNTIME" run --rm -it \
  -e COREPACK_ENABLE_AUTO_PIN=0 \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -v "$REPO_ROOT":/workspace \
  -w /workspace \
  "$IMAGE" \
  bash -c "$CMD"
