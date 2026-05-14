#!/usr/bin/env bash
# Run visual tests in a Docker container matching the CI environment. This script is designed for local testing.
#
# Usage: bin/visual-test.sh [--update] [playwright args...]
#   --update           Update snapshots instead of comparing against them.
#   -g "axes|bias"     Pass extra args to playwright (e.g. grep filter).

set -eo pipefail

IMAGE="mcr.microsoft.com/playwright:v1.60.0-noble"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

ARGS=()
if [[ "${1:-}" == "--update" ]]; then
  ARGS+=("--update-snapshots")
  shift
fi
ARGS+=("$@")

RUNTIME="${CONTAINER_RUNTIME:-docker}"

CMD="mkdir -p /tmp/bin && corepack enable --install-directory=/tmp/bin && export PATH=/tmp/bin:\$PATH && pnpm install --frozen-lockfile && pnpm run build && pnpm -F @uwdata/mosaic-spec test:visual"
for arg in "${ARGS[@]}"; do
  CMD+=" $(printf '%q' "$arg")"
done

exec "$RUNTIME" run --rm \
  --user "$(id -u):$(id -g)" \
  --memory 8g \
  -e HOME=/tmp \
  -e COREPACK_ENABLE_AUTO_PIN=0 \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -v "$REPO_ROOT":/workspace \
  -w /workspace \
  "$IMAGE" \
  bash -c "$CMD"
