#!/usr/bin/env bash
set -e

node_status=false
if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node -v 2>/dev/null)
  NODE_MAJOR=$(echo "$NODE_VERSION" | sed -E 's/^v([0-9]+).*/\1/')
  if [[ "$NODE_MAJOR" =~ ^[0-9]+$ ]] && [ "$NODE_MAJOR" -ge 18 ]; then
    node_status=true
  fi
fi

docker_status=false
if command -v docker >/dev/null 2>&1; then
  docker_status=true
fi

docker_compose_status=false
if command -v docker-compose >/dev/null 2>&1; then
  docker_compose_status=true
elif docker compose version >/dev/null 2>&1; then
  docker_compose_status=true
fi

git_status=false
if command -v git >/dev/null 2>&1; then
  git_status=true
fi

printf '{"node":%s,"docker":%s,"dockerCompose":%s,"git":%s}\n' \
  "$node_status" \
  "$docker_status" \
  "$docker_compose_status" \
  "$git_status"
