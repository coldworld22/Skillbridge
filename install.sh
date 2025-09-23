#!/usr/bin/env bash
set -euo pipefail

# Basic installation script.
# Usage: ./install.sh [development|production] [domain]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"

ensure_env_file() {
  local example_file=$1
  local target_file=$2

  if [[ -f "$example_file" && ! -f "$target_file" ]]; then
    echo "Creating $(basename "$target_file") from example file."
    cp "$example_file" "$target_file"
  fi
}

load_env_file() {
  local env_file=$1
  if [[ -f "$env_file" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  fi
}

run_compose() {
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  elif command -v docker >/dev/null 2>&1; then
    docker compose "$@"
  else
    echo "Docker is required but not installed." >&2
    return 1
  fi
}

MODE=${1:-}
DOMAIN=${2:-}
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

ensure_env_file "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
ensure_env_file "$REPO_ROOT/backend/.env.example" "$REPO_ROOT/backend/.env"

load_env_file "$REPO_ROOT/.env"
load_env_file "$REPO_ROOT/backend/.env"

if [[ -z "$MODE" ]]; then
  if [[ -t 0 ]]; then
    echo "Welcome to the SkillBridge installation wizard."
    read -rp "Choose mode ([d]evelopment/[p]roduction) [development]: " MODE_INPUT
    case "$MODE_INPUT" in
      ""|d|development) MODE=development ;;
      p|production) MODE=production ;;
      *) echo "Invalid selection: $MODE_INPUT" >&2; exit 1 ;;
    esac
  else
    MODE=development
  fi
fi

if [[ "$MODE" == "production" && -z "$DOMAIN" ]]; then
  if [[ -t 0 ]]; then
    read -rp "Enter domain (e.g., example.com): " DOMAIN
  else
    echo "Domain is required for production" >&2
    exit 1
  fi
fi

if [[ "$MODE" == "production" ]]; then
  if [[ -z "$DOMAIN" ]]; then
    echo "Domain is required for production" >&2
    echo "Usage: $0 production <domain>" >&2
    exit 1
  fi
  echo "Running server deployment for $DOMAIN"
  "$SCRIPT_DIR/scripts/deploy_server.sh" "$DOMAIN"
else
  echo "Running in development mode; no deployment actions performed."
fi

COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"
START_DEV_SERVICES=${START_DEV_SERVICES:-true}

if [[ "$MODE" == "production" ]]; then
  echo "Ensuring Docker services are running before migrations..."
  if ! run_compose -f "$COMPOSE_FILE" up -d; then
    echo "Failed to start Docker services required for production." >&2
    exit 1
  fi
elif [[ "$START_DEV_SERVICES" == "true" ]]; then
  echo "Starting development services with docker compose (detached)..."
  if ! run_compose -f "$COMPOSE_FILE" up --build -d; then
    echo "Failed to start development Docker services." >&2
    exit 1
  fi
else
  echo "Skipping automatic startup of development services."
fi

if [[ -z "$ADMIN_EMAIL" ]]; then
  if [[ -t 0 ]]; then
    read -rp "Enter admin email: " ADMIN_EMAIL
  else
    echo "ADMIN_EMAIL must be provided when running non-interactively." >&2
    exit 1
  fi
fi

if [[ -z "$ADMIN_PASSWORD" ]]; then
  if [[ -t 0 ]]; then
    read -rsp "Enter admin password: " ADMIN_PASSWORD
    echo
  else
    echo "ADMIN_PASSWORD must be provided when running non-interactively." >&2
    exit 1
  fi
fi

export ADMIN_EMAIL ADMIN_PASSWORD

echo "Running database migrations..."
if ! npm --prefix "$REPO_ROOT/backend" run migrate; then
  echo "Database migration failed. Aborting installation." >&2
  exit 1
fi

if [[ "${SEED_DB:-false}" == "true" ]]; then
  echo "Seeding database..."
  if ! npm --prefix "$REPO_ROOT/backend" run seed; then
    echo "Database seeding failed. Aborting installation." >&2
    exit 1
  fi
fi

echo "Provisioning initial admin account..."
node "$SCRIPT_DIR/backend/scripts/create-admin.js"
