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

require_env_var() {
  local var_name=$1
  if [[ -z "${var_name}" ]]; then
    return 0
  fi

  local value="${!var_name-}"
  if [[ -z "$value" ]]; then
    echo "Environment variable $var_name must be set before running the installer." >&2
    exit 1
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

url_encode() {
  node -e "process.stdout.write(encodeURIComponent(process.argv[1] ?? ''));" "$1"
}

derive_postgres_url() {
  local user="${POSTGRES_USER:-${DATABASE_USER:-}}"
  local password="${POSTGRES_PASSWORD:-${DATABASE_PASSWORD:-}}"
  local database="${POSTGRES_DB:-${DATABASE_NAME:-}}"
  local host="${DATABASE_HOST:-${POSTGRES_HOST:-localhost}}"
  local port="${DATABASE_PORT:-${POSTGRES_PORT:-5432}}"

  if [[ -z "$user" || -z "$password" || -z "$database" ]]; then
    return 1
  fi

  local encoded_user
  local encoded_password
  local encoded_db
  encoded_user=$(url_encode "$user")
  encoded_password=$(url_encode "$password")
  encoded_db=$(url_encode "$database")

  printf 'postgres://%s:%s@%s:%s/%s' "$encoded_user" "$encoded_password" "$host" "$port" "$encoded_db"
  return 0
}

run_compose() {
  local server_version=""
  local engine_major=""

  if command -v docker >/dev/null 2>&1; then
    if docker compose version >/dev/null 2>&1; then
      docker compose "$@"
      return $?
    fi

    server_version=$(docker version --format '{{.Server.Version}}' 2>/dev/null || true)
    if [[ -n "$server_version" ]]; then
      engine_major=${server_version%%.*}
      if [[ "$engine_major" =~ ^[0-9]+$ ]] && (( engine_major >= 27 )); then
        echo "Docker Engine $server_version detected but the docker compose plugin is unavailable." >&2
        echo "Install the Docker Compose plugin (the 'docker compose' command) or downgrade Docker Engine below version 27." >&2
        return 1
      fi
    fi

    echo "Docker is installed but the docker compose plugin is not available." >&2
    echo "Install the Docker Compose plugin (the 'docker compose' command) to continue." >&2
    return 1
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    echo "Only the legacy docker-compose v1 binary was found." >&2
    echo "Install the Docker Compose plugin (the 'docker compose' command) or downgrade Docker Engine below version 27 to avoid errors such as KeyError: 'ContainerConfig'." >&2
    return 1
  fi

  return 127
}

docker_available() {
  if command -v docker >/dev/null 2>&1; then
    return 0
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    return 0
  fi

  return 1
}

MODE=${1:-}
DOMAIN=${2:-}
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
INSTALL_CONFIG_PATH="${INSTALL_CONFIG_PATH:-}"

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
  if docker_available; then
    echo "Ensuring Docker services are running before migrations..."
    if ! run_compose -f "$COMPOSE_FILE" up -d; then
      echo "Failed to start Docker services required for production." >&2
      exit 1
    fi
  else
    echo "Docker CLI not available; skipping compose startup for production mode." >&2
  fi
elif [[ "$START_DEV_SERVICES" == "true" ]]; then
  if docker_available; then
    echo "Starting development services with docker compose (detached)..."
    if ! run_compose -f "$COMPOSE_FILE" up --build -d; then
      echo "Failed to start development Docker services." >&2
      exit 1
    fi
  else
    echo "Docker CLI not available; skipping development compose startup."
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

for required in DATABASE_URL DATABASE_USER DATABASE_PASSWORD SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS DEFAULT_FROM_EMAIL APP_DISPLAY_NAME; do
  if [[ -z "${!required-}" ]]; then
    case "$required" in
      DATABASE_URL)
        if [[ -n "${POSTGRES_URL:-}" ]]; then
          export DATABASE_URL="$POSTGRES_URL"
          if [[ -z "${PRODUCTION_DATABASE_URL:-}" ]]; then
            export PRODUCTION_DATABASE_URL="$DATABASE_URL"
          fi
        else
          if derived_url=$(derive_postgres_url); then
            export DATABASE_URL="$derived_url"
            if [[ -z "${PRODUCTION_DATABASE_URL:-}" ]]; then
              export PRODUCTION_DATABASE_URL="$derived_url"
            fi
          fi
        fi
        ;;
      DATABASE_USER)
        if [[ -n "${POSTGRES_USER:-}" ]]; then
          export DATABASE_USER="$POSTGRES_USER"
        fi
        ;;
      DATABASE_PASSWORD)
        if [[ -n "${POSTGRES_PASSWORD:-}" ]]; then
          export DATABASE_PASSWORD="$POSTGRES_PASSWORD"
        fi
        ;;
    esac
  fi

  require_env_var "$required"
done

export \
  ADMIN_EMAIL \
  ADMIN_PASSWORD \
  DATABASE_URL \
  DATABASE_USER \
  DATABASE_PASSWORD \
  SMTP_HOST \
  SMTP_PORT \
  SMTP_USER \
  SMTP_PASS \
  DEFAULT_FROM_EMAIL \
  APP_DISPLAY_NAME

echo "Applying configuration values..."
CONFIG_SCRIPT="$SCRIPT_DIR/backend/scripts/apply-install-config.js"
if ! node "$CONFIG_SCRIPT"; then
  echo "Failed to apply installation configuration." >&2
  exit 1
fi


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

APPLY_CONFIG_SCRIPT="$SCRIPT_DIR/backend/scripts/apply-installer-config.js"

if [[ -n "$INSTALL_CONFIG_PATH" ]]; then
  if [[ ! -f "$INSTALL_CONFIG_PATH" ]]; then
    echo "Installer configuration file not found: $INSTALL_CONFIG_PATH" >&2
    exit 1
  fi

  if [[ -f "$APPLY_CONFIG_SCRIPT" ]]; then
    echo "Applying installer configuration..."
    if ! node "$APPLY_CONFIG_SCRIPT" "$INSTALL_CONFIG_PATH"; then
      echo "Failed to apply installer configuration" >&2
      exit 1
    fi
  else
    echo "Warning: apply-installer-config script missing at $APPLY_CONFIG_SCRIPT" >&2
  fi
fi
