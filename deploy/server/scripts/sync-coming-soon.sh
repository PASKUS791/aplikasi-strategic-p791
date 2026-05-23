#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/strategic-p791/repo}"
WEB_ROOT="${WEB_ROOT:-/var/www/strategic-p791-coming-soon}"
BRANCH="${BRANCH:-main}"

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Repository not found at $REPO_DIR" >&2
  exit 1
fi

git -C "$REPO_DIR" fetch origin "$BRANCH"
git -C "$REPO_DIR" reset --hard "origin/$BRANCH"

install -d "$WEB_ROOT"
rsync -a --delete \
  --exclude '.DS_Store' \
  "$REPO_DIR/site/" "$WEB_ROOT/"

echo "Synced $REPO_DIR/site to $WEB_ROOT"

