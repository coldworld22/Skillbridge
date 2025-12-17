#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${INSTALL_REPO_ROOT:-$SCRIPT_DIR}"
cd "$REPO_ROOT"

MODE="${1:-}"
DOMAIN="${2:-}"

log() {
  printf '[SkillBridge] %s\n' "$*"
}

warn() {
  printf '[SkillBridge] WARNING: %s\n' "$*" >&2
}

abort() {
  printf '[SkillBridge] ERROR: %s\n' "$*" >&2
  exit 1
}

trap 'warn "Installer aborted. Review the output above for details."' ERR

relpath() {
  local target="$1"
  local relative="${target#${REPO_ROOT}/}"
  if [[ "$relative" == "$target" ]]; then
    printf '%s' "$target"
  else
    printf '%s' "$relative"
  fi
}

copy_if_missing() {
  local src="$1"
  local dest="$2"

  if [[ -f "$dest" ]]; then
    local pretty
    pretty="$(relpath "$dest")"
    log "Keeping existing ${pretty}"
    return 0
  fi

  if [[ ! -f "$src" ]]; then
    local template
    template="$(relpath "$src")"
    warn "Template ${template} missing; skipping."
    return 0
  fi

  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
  local created
  created="$(relpath "$dest")"
  log "Created ${created} from template."
}

select_mode_interactively() {
  if [[ -n "$MODE" ]]; then
    return 0
  fi

  echo "Welcome to the SkillBridge installation wizard."
  read -rp "Choose mode ([d]evelopment/[p]roduction) [development]: " MODE_INPUT
  case "$MODE_INPUT" in
    "" | d | development) MODE="development" ;;
    p | production) MODE="production" ;;
    *) abort "Invalid selection: $MODE_INPUT" ;;
  esac
}

ensure_domain_for_production() {
  if [[ "$MODE" != "production" ]]; then
    return 0
  fi
  if [[ -z "$DOMAIN" ]]; then
    read -rp "Enter domain (e.g., example.com): " DOMAIN
  fi
  if [[ -z "$DOMAIN" ]]; then
    abort "Domain is required for production installs."
  fi
}

determine_compose_command() {
  if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_CMD=(docker-compose)
  elif docker compose version >/dev/null 2>&1; then
    DOCKER_CMD=(docker compose)
  else
    abort "Docker Compose is required but not installed."
  fi
}

get_env_value() {
  local file="$1"
  local key="$2"
  local fallback="${3:-}"

  [[ -f "$file" ]] || { printf '%s\n' "$fallback"; return 0; }

  local line
  line="$(grep -E "^[[:space:]]*${key}=" "$file" | tail -n1 || true)"
  if [[ -z "$line" ]]; then
    printf '%s\n' "$fallback"
    return 0
  fi

  line="${line#*=}"
  line="${line%\"}"
  line="${line#\"}"
  line="${line%\\'}"
  line="${line#\\'}"
  printf '%s\n' "$line"
}

wait_for_postgres() {
  local attempts=0
  local max_attempts=30
  local db_user
  db_user="$(get_env_value "$REPO_ROOT/.env" "POSTGRES_USER" "postgres")"

  log "Waiting for Postgres to accept connections..."
  while (( attempts < max_attempts )); do
    if "${DOCKER_CMD[@]}" exec -T db pg_isready -U "$db_user" >/dev/null 2>&1; then
      log "Postgres is ready."
      return 0
    fi
    ((attempts++))
    sleep 2
  done
  warn "Postgres did not report ready status after $((max_attempts * 2)) seconds."
}

run_prereq_check() {
  log "Checking system prerequisites..."
  "$REPO_ROOT/scripts/check_prereqs.sh"
}

prepare_env_files() {
  log "Ensuring environment files exist..."
  copy_if_missing "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
  copy_if_missing "$REPO_ROOT/backend/.env.example" "$REPO_ROOT/backend/.env"
  copy_if_missing "$REPO_ROOT/frontend/.env.local.example" "$REPO_ROOT/frontend/.env.local"
}

run_migrations() {
  log "Applying database migrations..."
  "${DOCKER_CMD[@]}" run --rm backend npm run migrate
}

run_seed() {
  log "Seeding database..."
  "${DOCKER_CMD[@]}" run --rm backend npm run seed
}

start_development_stack() {
  run_prereq_check
  determine_compose_command
  prepare_env_files

  log "Building and starting core services (db, redis, pgadmin)..."
  "${DOCKER_CMD[@]}" up -d --build db redis pgadmin
  wait_for_postgres

  run_migrations
  run_seed

  log "Starting the full Docker stack..."
  "${DOCKER_CMD[@]}" up -d --build

  cat <<EOF

Development environment is ready.

- Backend API:  http://localhost:5002/api
- Frontend UI:  http://localhost:3000
- pgAdmin:      http://localhost:5050 (credentials from .env)

Update the generated .env files with real secrets when needed, then rerun:
  ${DOCKER_CMD[*]} up -d --build

EOF
}

start_production_stack() {
  run_prereq_check
  determine_compose_command
  prepare_env_files

  if [[ $EUID -ne 0 ]]; then
    abort "Production install must run with sudo/root so certificates can be issued."
  fi

  log "Provisioning nginx and TLS certificates for $DOMAIN..."
  "$REPO_ROOT/scripts/deploy_server.sh" "$DOMAIN"

  log "Building containers..."
  "${DOCKER_CMD[@]}" build

  log "Starting core services..."
  "${DOCKER_CMD[@]}" up -d db redis pgadmin
  wait_for_postgres

  run_migrations
  run_seed

  log "Starting application services..."
  "${DOCKER_CMD[@]}" up -d

  cat <<EOF

Production deployment complete for $DOMAIN

- Verify HTTPS via https://$DOMAIN
- API served at https://$DOMAIN/api
- Disable INSTALL_API_ENABLED once setup is finished.

EOF
}

main() {
  select_mode_interactively
  ensure_domain_for_production

  case "$MODE" in
    development) start_development_stack ;;
    production) start_production_stack ;;
    *) abort "Unknown mode: $MODE" ;;
  esac
}

main "$@"
