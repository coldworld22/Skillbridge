#!/usr/bin/env bash
set -euo pipefail

exec 3>&1
exec 1>&2

SUCCESS_SUMMARY="SkillBridge installation completed successfully."
LAST_ERROR_MESSAGE=""
CURRENT_STEP=""

json_string() {
  local input="${1-}"
  input=${input//\\/\\\\}
  input=${input//\"/\\\"}
  input=${input//$'\n'/\\n}
  input=${input//$'\r'/}
  input=${input//$'\t'/\\t}
  printf '"%s"' "$input"
}

emit_exit_payload() {
  local status=$1
  local summary message
  if (( status == 0 )); then
    summary=${CURRENT_STEP:-$SUCCESS_SUMMARY}
    printf '{ "ok": true, "summary": %s }\n' "$(json_string "$summary")" >&3
  else
    message=${LAST_ERROR_MESSAGE:-${CURRENT_STEP:+"${CURRENT_STEP} failed."}}
    if [[ -z "$message" ]]; then
      message="Installation failed. Review stderr output for details."
    fi
    printf '{ "ok": false, "summary": %s, "exitCode": %s }\n' "$(json_string "$message")" "$status" >&3
  fi
}

record_error() {
  local status=$1
  local command=$2
  if [[ -z "$LAST_ERROR_MESSAGE" ]]; then
    LAST_ERROR_MESSAGE="Command failed (exit ${status}): ${command}"
  fi
}

fail() {
  local message="$1"
  shift || true
  LAST_ERROR_MESSAGE="$message"
  echo "$message"
  for line in "$@"; do
    echo "$line"
  done
  exit 1
}

announce_step() {
  local message="$1"
  CURRENT_STEP="$message"
  echo "$message"
}

trap 'emit_exit_payload $?' EXIT
trap 'record_error $? "$BASH_COMMAND"' ERR

# Basic installation script.
# Usage: ./install.sh [development|production] [domain]

MODE_ARG=${1:-}
DOMAIN_ARG=${2:-}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"

check_prerequisites() {
  local prereq_script="$REPO_ROOT/scripts/check_prereqs.sh"
  local payload=""
  local status=0

  if [[ -x "$prereq_script" ]]; then
    set +e
    payload=$("$prereq_script")
    status=$?
    set -e
    if command -v node >/dev/null 2>&1; then
      print_prereq_report "$payload"
    else
      printf '%s\n' "$payload"
    fi
    return "$status"
  fi

  local missing=()
  local result=0

  for tool in node npm; do
    if ! command -v "$tool" >/dev/null 2>&1; then
      missing+=("$tool")
    fi
  done

  if (( ${#missing[@]} > 0 )); then
    fail "Missing required command(s): ${missing[*]}" "Install the missing tools and re-run the installer."
  fi

  local node_version
  node_version=$(node -v 2>/dev/null | sed 's/^v//')
  if [[ -z "$node_version" ]]; then
    fail "Unable to determine Node.js version."
  fi

  local node_major=${node_version%%.*}
  if [[ ! "$node_major" =~ ^[0-9]+$ ]]; then
    fail "Unrecognized Node.js version string: $node_version"
  fi

  if (( node_major < 18 )); then
    fail "SkillBridge requires Node.js 18 or later (found $node_version)."
  fi

  case "$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')" in
    1|true|yes|on)
      return 0
      ;;
  esac

  return 1
}

ensure_env_file() {
  local example_file=$1
  local target_file=$2

  if [[ -f "$example_file" && ! -f "$target_file" ]]; then
    echo "Creating $(basename "$target_file") from example file."
    cp "$example_file" "$target_file"

    if [[ "$target_file" == */frontend/.env.local ]]; then
      echo "Update frontend/.env.local so NEXT_PUBLIC_API_BASE_URL points at your API before starting the frontend."
    fi
  fi
}

require_env_var() {
  local var_name=$1
  if [[ -z "${var_name}" ]]; then
    return 0
  fi

  local value="${!var_name-}"
  if [[ -z "$value" ]]; then
    fail "Environment variable $var_name must be set before running the installer."
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

require_command() {
  local command_name=$1
  local friendly_name=${2:-$1}

  if ! command -v "$command_name" >/dev/null 2>&1; then
    fail "$friendly_name ($command_name) is required but was not found on PATH."
  fi
}

ensure_node_version() {
  local version major
  version=$(node -v 2>/dev/null || true)
  major=${version#v}
  major=${major%%.*}

  if [[ -z "$major" || ! "$major" =~ ^[0-9]+$ || "$major" -lt 18 ]]; then
    fail "Node.js 18 or newer is required. Detected ${version:-unknown}."
  fi
}

ensure_backend_upload_dir() {
  local uploads_dir="$REPO_ROOT/backend/uploads/app"

  if [[ ! -d "$uploads_dir" ]]; then
    echo "Creating backend uploads directory at $uploads_dir"
    mkdir -p "$uploads_dir"
  fi
}

install_node_dependencies() {
  local target_dir=${1:-}

  if [[ -z "$target_dir" ]]; then
    echo "install_node_dependencies requires a target path." >&2
    exit 1
  fi

  echo "Installing Node.js dependencies in $target_dir"
  if ! npm --prefix "$target_dir" install; then
    echo "Failed to install Node.js dependencies in $target_dir." >&2
    exit 1
  fi
}

print_prereq_report() {
  local payload=$1
  if [[ -z "$payload" ]]; then
    return
  fi

  node - "$payload" <<'NODE'
const raw = process.argv[2] || '';
if (!raw.trim()) {
  process.exit(0);
}

try {
  const data = JSON.parse(raw);
  const ok = Boolean(data.ok ?? data.allPassed);
  const summary = typeof data.summary === 'string' && data.summary.trim()
    ? data.summary.trim()
    : ok
      ? 'All prerequisites satisfied.'
      : 'Some prerequisites require attention.';

  console.log(summary);

  if (Array.isArray(data.requirements)) {
    for (const req of data.requirements) {
      const statusRaw = (req && (req.status || (req.passed ? 'pass' : 'fail'))) || '';
      const status = statusRaw.toString().toLowerCase();
      const icon = status === 'pass' ? '✔' : status === 'warn' ? '⚠' : '✖';
      const label = (req && (req.label || req.name || req.id)) || 'Requirement';
      const message = req && (req.message || req.details || req.hint) ? ` - ${req.message || req.details || req.hint}` : '';
      console.log(`  ${icon} ${label}${message}`);
    }
  }
} catch (err) {
  console.log(raw.trim());
}
NODE
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

    echo "Docker is installed but the docker compose plugin is not available."
    echo "Install the Docker Compose plugin (the 'docker compose' command) to continue."
    return 1
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    echo "Only the legacy docker-compose v1 binary was found."
    echo "Install the Docker Compose plugin (the 'docker compose' command) or downgrade Docker Engine below version 27 to avoid errors such as KeyError: 'ContainerConfig'."
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

install_backend_dependencies() {
  local skip="${SKIP_BACKEND_NPM_INSTALL:-false}"
  case "$skip" in
    1|true|TRUE|yes|YES|on|ON)
      echo "Skipping backend dependency installation (SKIP_BACKEND_NPM_INSTALL=$skip)."
      return 0
      ;;
  esac

  announce_step "Installing backend dependencies (npm install)..."
  if ! npm --prefix "$REPO_ROOT/backend" install; then
    fail "Failed to install backend dependencies."
  fi
}

ensure_backend_upload_dir() {
  local uploads_dir="$REPO_ROOT/backend/uploads/app"

  if [[ -d "$uploads_dir" ]]; then
    return 0
  fi

  echo "Creating backend uploads directory at $uploads_dir"
  if ! mkdir -p "$uploads_dir"; then
    echo "Failed to create backend uploads directory at $uploads_dir" >&2
    exit 1
  fi
}

install_node_dependencies() {
  local target_dir=${1:-}

  if [[ -z "$target_dir" ]]; then
    echo "install_node_dependencies requires a target directory argument." >&2
    exit 1
  fi

  if [[ "${NODE_DEPS_INSTALLED:-false}" == "true" ]]; then
    return 0
  fi

  case "$target_dir" in
    "$REPO_ROOT/backend")
      install_backend_dependencies
      ;;
    *)
      echo "Installing Node dependencies in $target_dir..."
      if ! npm --prefix "$target_dir" install; then
        echo "Failed to install Node dependencies in $target_dir." >&2
        exit 1
      fi
      ;;
  esac

  NODE_DEPS_INSTALLED=true
}

NODE_DEPS_INSTALLED=false
CLI_MODE=${1:-}
CLI_DOMAIN=${2:-}

if ! check_prerequisites; then
  if ! is_truthy "${ALLOW_PREREQ_FAILURES:-}"; then
    echo "Aborting installation due to failed prerequisite checks." >&2
    echo "Resolve the issues above or set ALLOW_PREREQ_FAILURES=true to override." >&2
    exit 1
  fi

  echo "Continuing despite prerequisite failures because ALLOW_PREREQ_FAILURES=${ALLOW_PREREQ_FAILURES:-true}." >&2
fi

ensure_env_file "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
ensure_env_file "$REPO_ROOT/backend/.env.example" "$REPO_ROOT/backend/.env"
ensure_env_file "$REPO_ROOT/backend/.env.production.example" "$REPO_ROOT/backend/.env.production"
ensure_env_file "$REPO_ROOT/frontend/.env.local.example" "$REPO_ROOT/frontend/.env.local"

load_env_file "$REPO_ROOT/.env"

ensure_backend_upload_dir
MODE=${CLI_MODE:-${MODE:-}}

load_env_file "$REPO_ROOT/backend/.env"

DOMAIN=${CLI_DOMAIN:-${DOMAIN:-}}

if [[ -z "$MODE" ]]; then
  if [[ -t 0 ]]; then
    echo "Welcome to the SkillBridge installation wizard."
    read -rp "Choose mode ([d]evelopment/[p]roduction) [development]: " MODE_INPUT
    case "$MODE_INPUT" in
      ""|d|development) MODE=development ;;
      p|production) MODE=production ;;
      *) fail "Invalid selection: $MODE_INPUT" ;;
    esac
  else
    MODE=development
  fi
fi

if [[ "$MODE" == "production" && -z "$DOMAIN" ]]; then
  if [[ -t 0 ]]; then
    read -rp "Enter domain (e.g., example.com): " DOMAIN
  else
    fail "Domain is required for production"
  fi
fi

if [[ "$MODE" == "production" ]]; then
  load_env_file "$REPO_ROOT/backend/.env.production"
  DOMAIN=${CLI_DOMAIN:-${DOMAIN:-}}
fi

if [[ "$MODE" == "production" ]]; then
  if [[ -z "$DOMAIN" ]]; then
    fail "Domain is required for production" "Usage: $0 production <domain>"
  fi
  announce_step "Running server deployment for $DOMAIN"
  "$SCRIPT_DIR/scripts/deploy_server.sh" "$DOMAIN"
else
  announce_step "Running in development mode; no deployment actions performed."
fi

COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"
START_DEV_SERVICES=${START_DEV_SERVICES:-true}

ensure_env_file "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
ensure_env_file "$REPO_ROOT/backend/.env.example" "$REPO_ROOT/backend/.env"
ensure_env_file "$REPO_ROOT/frontend/.env.local.example" "$REPO_ROOT/frontend/.env.local"
if [[ "$MODE" == "production" ]]; then
  ensure_env_file "$REPO_ROOT/backend/.env.production.example" "$REPO_ROOT/backend/.env.production"
fi

load_env_file "$REPO_ROOT/.env"
load_env_file "$REPO_ROOT/backend/.env"
if [[ "$MODE" == "production" ]]; then
  load_env_file "$REPO_ROOT/backend/.env.production"
fi

install_node_dependencies "$REPO_ROOT/backend"

if [[ "$MODE" == "production" ]]; then
  if docker_available; then
    announce_step "Ensuring Docker services are running before migrations..."
    if ! run_compose -f "$COMPOSE_FILE" up -d; then
      fail "Failed to start Docker services required for production."
    fi
  else
    echo "Docker CLI not available; skipping compose startup for production mode."
  fi
elif [[ "$START_DEV_SERVICES" == "true" ]]; then
  if docker_available; then
    announce_step "Starting development services with docker compose (detached)..."
    if ! run_compose -f "$COMPOSE_FILE" up --build -d; then
      fail "Failed to start development Docker services."
    fi
  else
    echo "Docker CLI not available; skipping development compose startup."
  fi
else
  announce_step "Skipping automatic startup of development services."
fi

ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
INSTALL_CONFIG_PATH="${INSTALL_CONFIG_PATH:-}"

if [[ -z "$ADMIN_EMAIL" ]]; then
  if [[ -t 0 ]]; then
    read -rp "Enter admin email: " ADMIN_EMAIL
  else
    fail "ADMIN_EMAIL must be provided when running non-interactively."
  fi
fi

if [[ -z "$ADMIN_PASSWORD" ]]; then
  if [[ -t 0 ]]; then
    read -rsp "Enter admin password: " ADMIN_PASSWORD
    echo
  else
    fail "ADMIN_PASSWORD must be provided when running non-interactively."
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
install_node_dependencies "$REPO_ROOT/backend"

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

announce_step "Applying configuration values..."
CONFIG_SCRIPT="$SCRIPT_DIR/backend/scripts/apply-install-config.js"
if ! node "$CONFIG_SCRIPT"; then
  fail "Failed to apply installation configuration."
fi


announce_step "Running database migrations..."
if ! npm --prefix "$REPO_ROOT/backend" run migrate; then
  fail "Database migration failed. Aborting installation."
fi

if [[ "${SEED_DB:-false}" == "true" ]]; then
  announce_step "Seeding database..."
  if ! npm --prefix "$REPO_ROOT/backend" run seed; then
    fail "Database seeding failed. Aborting installation."
  fi
fi

announce_step "Provisioning initial admin account..."
node "$SCRIPT_DIR/backend/scripts/create-admin.js"

APPLY_CONFIG_SCRIPT="$SCRIPT_DIR/backend/scripts/apply-installer-config.js"

if [[ -n "$INSTALL_CONFIG_PATH" ]]; then
  if [[ ! -f "$INSTALL_CONFIG_PATH" ]]; then
    fail "Installer configuration file not found: $INSTALL_CONFIG_PATH"
  fi

  if [[ -f "$APPLY_CONFIG_SCRIPT" ]]; then
    announce_step "Applying installer configuration..."
    if ! node "$APPLY_CONFIG_SCRIPT" "$INSTALL_CONFIG_PATH"; then
      fail "Failed to apply installer configuration"
    fi
  else
    echo "Warning: apply-installer-config script missing at $APPLY_CONFIG_SCRIPT"
  fi
fi

announce_step "$SUCCESS_SUMMARY"
