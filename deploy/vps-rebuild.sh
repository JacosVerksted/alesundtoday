#!/usr/bin/env bash
# Scrape the mooring plan, build the site and publish it — all on the VPS.
# Replaces the GitHub Actions workflows (daily-rebuild / refresh-data).
#
# Code comes from GitHub (public repo, plain https pull). Node never touches the
# host: scrape + build run in a throwaway node:22-alpine docker run.
#
# Usage:  vps-rebuild.sh            # pull, scrape, build, publish
#         DIST_DIR=/tmp/x vps-rebuild.sh   # dry run into another folder
#
# Optional ~/docker/alesundtoday/rebuild.env:  KUMA_PUSH_URL=https://…/api/push/<token>
set -euo pipefail

BASE="${BASE:-/home/rick/docker/alesundtoday}"
SRC="$BASE/src"
DIST_DIR="${DIST_DIR:-$BASE/dist}"          # bind-mounted into nginx
LAST_GOOD="$BASE/schedule.last-good.json"
LOG="$BASE/rebuild.log"
REPO="https://github.com/JacosVerksted/alesundtoday.git"
IMAGE="node:22-alpine"

[ -f "$BASE/rebuild.env" ] && . "$BASE/rebuild.env"

exec >>"$LOG" 2>&1
echo "=== $(date -u +%FT%TZ) start (dist: $DIST_DIR)"

# Never run two at once
exec 9>"$BASE/.rebuild.lock"
flock -n 9 || { echo "another run is active, exiting"; exit 0; }

report() {  # report ok|down "message"  → Uptime Kuma push monitor, if configured
  [ -n "${KUMA_PUSH_URL:-}" ] || return 0
  curl -fsS -m 10 --get --data-urlencode "status=$1" --data-urlencode "msg=$2" "$KUMA_PUSH_URL" >/dev/null || true
}
trap 'echo "FAILED (line $LINENO)"; report down "rebuild failed"' ERR

# 1. Code from GitHub
if [ -d "$SRC/.git" ]; then
  git -C "$SRC" fetch -q origin main
  git -C "$SRC" reset -q --hard origin/main
else
  git clone -q "$REPO" "$SRC"
fi
echo "commit: $(git -C "$SRC" rev-parse --short HEAD)"

run_node() {  # run_node "<shell command>"  — capped, non-root, no host install
  docker run --rm --memory 1g --cpus 2 --user "$(id -u):$(id -g)" \
    -e HOME=/tmp -e npm_config_cache=/tmp/.npm \
    -v "$SRC:/app" -w /app "$IMAGE" sh -c "$1"
}

# 2. Fresh schedule; if the scrape fails keep the last good one rather than fail the site
run_node "npm ci --no-audit --no-fund --loglevel=error"
if run_node "node scraper/scrape.mjs"; then
  cp "$SRC/public/schedule.json" "$LAST_GOOD"
else
  echo "WARN: scrape failed — using last good schedule"
  [ -f "$LAST_GOOD" ] && cp "$LAST_GOOD" "$SRC/public/schedule.json"
  SCRAPE_FAILED=1
fi

# 3. Build
run_node "npm run build"

# 4. Publish into the live folder. Can't swap the directory itself (nginx has it
#    bind-mounted), so: add new files first, delete old ones last — the page and
#    its hashed assets are never missing at the same time.
mkdir -p "$DIST_DIR"
rsync -a --delete-after "$SRC/dist/" "$DIST_DIR/"

echo "=== done ${SCRAPE_FAILED:+(scrape failed, stale data) }$(date -u +%FT%TZ)"
if [ -n "${SCRAPE_FAILED:-}" ]; then report down "published, but scrape failed"; else report up "ok"; fi
