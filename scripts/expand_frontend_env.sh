#!/usr/bin/env sh
set -e
# Generate a fully expanded frontend/.env.production.expanded from frontend/.env.production template
script_dir="$(dirname "$0")"
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"
set -a
. frontend/.env.production
set +a
envsubst < frontend/.env.production > frontend/.env.production.expanded
