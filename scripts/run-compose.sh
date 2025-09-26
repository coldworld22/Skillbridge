#!/usr/bin/env bash
set -euo pipefail

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  exec docker compose "$@"
elif command -v docker-compose >/dev/null 2>&1; then
  export DOCKER_API_VERSION="${DOCKER_API_VERSION:-1.43}"
  exec docker-compose "$@"
else
  echo "Error: Docker Compose is not installed." >&2
  exit 1
fi
