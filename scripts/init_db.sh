#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Determine docker compose command
if command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
else
  DOCKER_COMPOSE="docker compose"
fi

if [ -n "$($DOCKER_COMPOSE ps -q backend 2>/dev/null)" ]; then
  echo "Running migrations inside backend container..."
  $DOCKER_COMPOSE exec backend npx knex migrate:latest --knexfile knexfile.js
  $DOCKER_COMPOSE exec backend npx knex seed:run --knexfile knexfile.js
else
  echo "Running migrations locally..."
  npx knex migrate:latest --knexfile backend/knexfile.js
  npx knex seed:run --knexfile backend/knexfile.js
fi
