#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$SCRIPT_DIR/scripts/check_prereqs.sh"

# Clone repository if not already inside one
if [ ! -d "$SCRIPT_DIR/.git" ]; then
  REPO_URL=${REPO_URL:-https://github.com/example/Skillbridge.git}
  git clone "$REPO_URL" Skillbridge
  cd Skillbridge
  SCRIPT_DIR="$(pwd)"
else
  cd "$SCRIPT_DIR"
fi

# Copy env templates
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
fi
if [ ! -f frontend/.env.local ]; then
  cp frontend/.env.local.example frontend/.env.local
fi

# Determine docker compose command
if command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
else
  DOCKER_COMPOSE="docker compose"
fi

$DOCKER_COMPOSE up -d --build

scripts/init_db.sh

cat <<INFO
Application is running.

Frontend: http://localhost:3000
API:      http://localhost:5002

Seeded accounts:
  SuperAdmin: support@eduskillbridge.net
  Admin:      admin@eduskillbridge.net
Check above output for generated passwords or set ADMIN_INITIAL_PASSWORD and SUPERADMIN_INITIAL_PASSWORD in backend/.env before running.
INFO
