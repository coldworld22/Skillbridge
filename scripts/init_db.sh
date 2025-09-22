#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Determine docker compose command, preferring the v2 plugin
if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
else
  echo "Docker Compose is required but not installed. Install the Docker Compose plugin (v2)." >&2
  exit 1
fi

if [ -n "$($DOCKER_COMPOSE ps -q backend 2>/dev/null)" ]; then
  echo "Running migrations inside backend container..."
  $DOCKER_COMPOSE exec backend npx knex migrate:latest --knexfile knexfile.js
  if [ "$NODE_ENV" != "production" ] && [ "$SEED_DB" = "true" ]; then
    $DOCKER_COMPOSE exec backend npx knex seed:run --knexfile knexfile.js
  fi
else
  echo "Running migrations locally..."
  npx knex migrate:latest --knexfile backend/knexfile.js
  if [ "$NODE_ENV" != "production" ] && [ "$SEED_DB" = "true" ]; then
    npx knex seed:run --knexfile backend/knexfile.js
  fi
fi
