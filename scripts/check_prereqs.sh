#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

requirements=()
all_ok=true
ENV_FILES=("$REPO_ROOT/.env" "$REPO_ROOT/backend/.env" "$REPO_ROOT/backend/.env.local" "$REPO_ROOT/backend/.env.production")
PYTHON_BIN="$(command -v python3 || command -v python || true)"

escape_json() {
  local s="${1-}"
  s=${s//\\/\\\\}
  s=${s//\"/\\\"}
  s=${s//$'\n'/\\n}
  s=${s//$'\r'/}
  s=${s//$'\t'/\\t}
  echo "$s"
}

add_requirement() {
  local id="$1"
  local label="$2"
  local status="$3"
  local message="$4"

  local escaped_label
  escaped_label=$(escape_json "$label")
  local escaped_message
  escaped_message=$(escape_json "$message")

  local passed="false"
  case "$status" in
    pass|PASS|ok|OK|ready|READY)
      passed="true"
      status="pass"
      ;;
    warn|WARN|warning|WARNING)
      status="warn"
      ;;
    *)
      status="fail"
      ;;
  esac

  requirements+=(
    "{\"id\":\"$id\",\"label\":\"$escaped_label\",\"status\":\"$status\",\"passed\":$passed,\"message\":\"$escaped_message\"}"
  )

  if [ "$passed" != "true" ]; then
    all_ok=false
  fi
}

trim_whitespace() {
  local value="$1"
  value="${value#${value%%[![:space:]]*}}"
  value="${value%${value##*[![:space:]]}}"
  echo "$value"
}

lookup_env_file_value() {
  local key="$1"
  shift
  local file line raw_key value
  for file in "$@"; do
    [ -f "$file" ] || continue
    while IFS= read -r line || [ -n "$line" ]; do
      line="${line%%$'\r'}"
      line=$(trim_whitespace "$line")
      [ -n "$line" ] || continue
      case "$line" in
        \#*) continue ;;
      esac
      if [[ "$line" == export* ]]; then
        line=${line#export}
        line=$(trim_whitespace "$line")
      fi
      raw_key=${line%%=*}
      raw_key=$(trim_whitespace "$raw_key")
      [ "$raw_key" = "$key" ] || continue
      value=${line#*=}
      value=$(trim_whitespace "$value")
      case "$value" in
        "\""*"\"") value=${value:1:-1} ;;
        "'"*"'") value=${value:1:-1} ;;
      esac
      echo "$value"
      return 0
    done <"$file"
  done
  return 1
}

get_env_value() {
  local key="$1"
  local value="${!key-}"
  if [ -n "$value" ]; then
    echo "$value"
    return 0
  fi
  lookup_env_file_value "$key" "${ENV_FILES[@]}" || true
}

join_by() {
  local IFS="$1"
  shift
  echo "$*"
}

check_smtp_configuration() {
  local disable
  disable=$(get_env_value "DISABLE_EMAILS")
  if [ -n "$disable" ]; then
    local normalized_disable
    normalized_disable=$(echo "$disable" | tr '[:upper:]' '[:lower:]')
    if [ "$normalized_disable" = "true" ]; then
      add_requirement "smtp_env" "SMTP configuration" "pass" "Email delivery is disabled (DISABLE_EMAILS=true); SMTP credentials are optional."
      return
    fi
  fi

  local required=("SMTP_HOST" "SMTP_PORT" "SMTP_USER" "SMTP_PASS")
  local missing=()
  local smtp_host=""
  local smtp_port=""
  local smtp_user=""
  local value
  local var

  for var in "${required[@]}"; do
    value=$(get_env_value "$var")
    if [ -n "$value" ]; then
      case "$var" in
        SMTP_HOST) smtp_host="$value" ;;
        SMTP_PORT) smtp_port="$value" ;;
        SMTP_USER) smtp_user="$value" ;;
      esac
    else
      missing+=("$var")
    fi
  done

  if [ "${#missing[@]}" -gt 0 ]; then
    add_requirement "smtp_env" "SMTP configuration" "fail" "Missing variables: $(join_by ', ' "${missing[@]}"). Provide SMTP credentials or set DISABLE_EMAILS=true to bypass email delivery during installation."
    return
  fi

  if ! [[ "$smtp_port" =~ ^[0-9]+$ ]]; then
    add_requirement "smtp_env" "SMTP configuration" "fail" "SMTP_PORT must be a numeric port. Current value: ${smtp_port}."
    return
  fi

  local message="SMTP credentials detected for ${smtp_host}:${smtp_port}."
  if [ -n "$smtp_user" ]; then
    message+=" Username ${smtp_user} will be used for authentication."
  fi

  add_requirement "smtp_env" "SMTP configuration" "pass" "$message"
}

check_single_env() {
  local id="$1"
  local label="$2"
  local key="$3"
  local value
  value=$(get_env_value "$key")

  if [ -n "$value" ]; then
    add_requirement "$id" "$label" "pass" "$key is set."
  else
    add_requirement "$id" "$label" "fail" "$key is missing. Define it in backend/.env or your runtime environment so the installer can apply your branding."
  fi
}

parse_database_url() {
  local url="$1"
  if [ -z "$url" ] || [ -z "$PYTHON_BIN" ]; then
    return 1
  fi

  "$PYTHON_BIN" - "$url" <<'PY'
import sys
from urllib.parse import urlparse

url = sys.argv[1]
parsed = urlparse(url)
if not parsed.scheme:
    sys.exit(0)

host = parsed.hostname or ''
port = parsed.port or ''
user = parsed.username or ''
password = parsed.password or ''
database = (parsed.path or '').lstrip('/')

print(f"HOST={host}")
print(f"PORT={port}")
print(f"USER={user}")
print(f"PASSWORD={password}")
print(f"DATABASE={database}")
PY
}

check_database_connection() {
  local db_url host port user password database
  local parse_output

  db_url=$(get_env_value "DATABASE_URL")
  if [ -z "$db_url" ]; then
    db_url=$(get_env_value "PRODUCTION_DATABASE_URL")
  fi

  if [ -n "$db_url" ]; then
    if [ -n "$PYTHON_BIN" ]; then
      parse_output=$(parse_database_url "$db_url" || true)
      if [ -n "$parse_output" ]; then
        while IFS='=' read -r key value; do
          case "$key" in
            HOST) [ -n "$value" ] && host="$value" ;;
            PORT) [ -n "$value" ] && port="$value" ;;
            USER) [ -n "$value" ] && user="$value" ;;
            PASSWORD) password="$value" ;;
            DATABASE) [ -n "$value" ] && database="$value" ;;
          esac
        done <<<"$parse_output"
      fi
    else
      add_requirement "database_connection" "Database connectivity" "fail" "DATABASE_URL is defined but Python is unavailable to parse it. Install Python 3 or provide discrete DATABASE_* variables."
      return
    fi
  fi

  host="${host:-$(get_env_value "DATABASE_HOST")}" \
    || host="${host:-$(get_env_value "POSTGRES_HOST")}" || true
  port="${port:-$(get_env_value "DATABASE_PORT")}" \
    || port="${port:-$(get_env_value "POSTGRES_PORT")}" || true
  user="${user:-$(get_env_value "DATABASE_USER")}" \
    || user="${user:-$(get_env_value "POSTGRES_USER")}" || true
  password="${password:-$(get_env_value "DATABASE_PASSWORD")}" \
    || password="${password:-$(get_env_value "POSTGRES_PASSWORD")}" || true
  database="${database:-$(get_env_value "DATABASE_NAME")}" \
    || database="${database:-$(get_env_value "POSTGRES_DB")}" || true

  if [ -z "$host" ] || [ -z "$user" ] || [ -z "$database" ]; then
    add_requirement "database_connection" "Database connectivity" "fail" "Database configuration is incomplete. Provide host, user, and database name via DATABASE_URL or the DATABASE_*/POSTGRES_* variables."
    return
  fi

  if [ -z "$port" ]; then
    port=5432
  fi

  local connection_message
  local status="pass"

  if command -v psql >/dev/null 2>&1; then
    if timeout 10 env PGPASSWORD="$password" PGCONNECT_TIMEOUT=5 PSQLRC=/dev/null psql \
      --no-password --tuples-only --quiet --command "SELECT 1" \
      --host "$host" --port "$port" --username "$user" --dbname "$database" >/dev/null 2>&1; then
      connection_message="Successfully authenticated with PostgreSQL at $host:$port as $user."
    else
      status="fail"
      connection_message="Failed to authenticate with PostgreSQL at $host:$port using the provided credentials. Verify the server is running and the username/password are correct."
    fi
  else
    if timeout 5 bash -c "cat < /dev/null > /dev/tcp/$host/$port" >/dev/null 2>&1; then
      connection_message="PostgreSQL at $host:$port is reachable. Install psql to validate credentials automatically, or test manually using the same environment variables."
      if [ -z "$password" ]; then
        connection_message+=" No database password was detected; set DATABASE_PASSWORD or POSTGRES_PASSWORD if your server requires one."
      fi
    else
      status="fail"
      connection_message="Unable to reach PostgreSQL at $host:$port. Check that the host is correct, the service is running, and firewalls permit the connection."
    fi
  fi

  add_requirement "database_connection" "Database connectivity" "$status" "$connection_message"
}

check_logo_path() {
  local logo_dir="$REPO_ROOT/backend/uploads/app"
  if [ ! -d "$logo_dir" ]; then
    add_requirement "logo_path" "Logo upload directory" "fail" "${logo_dir} does not exist. Create the directory and ensure the backend service can write to it."
    return
  fi

  if [ ! -w "$logo_dir" ]; then
    add_requirement "logo_path" "Logo upload directory" "fail" "${logo_dir} exists but is not writable. Adjust permissions (e.g., chown/chmod) so the backend can store branding assets."
    return
  fi

  local tmp_file="$logo_dir/.write-test-$$"
  if touch "$tmp_file" 2>/dev/null; then
    rm -f "$tmp_file"
    add_requirement "logo_path" "Logo upload directory" "pass" "${logo_dir} is writable."
  else
    add_requirement "logo_path" "Logo upload directory" "fail" "${logo_dir} is present but a write test failed. Review filesystem permissions and available disk space."
  fi
}

# Verify Node.js
if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node -v 2>/dev/null || true)
  NODE_MAJOR=$(echo "$NODE_VERSION" | sed -E 's/^v([0-9]+).*/\1/')
  if [[ "$NODE_MAJOR" =~ ^[0-9]+$ && "$NODE_MAJOR" -ge 18 ]]; then
    add_requirement "node" "Node.js >= 18" "pass" "Detected ${NODE_VERSION}"
  else
    add_requirement "node" "Node.js >= 18" "fail" "Detected ${NODE_VERSION:-unknown}. Version 18 or newer required."
  fi
else
  add_requirement "node" "Node.js >= 18" "fail" "Node.js executable not found."
fi

# Verify Docker
docker_present=false
if command -v docker >/dev/null 2>&1; then
  docker_present=true
  DOCKER_VERSION=$(docker --version 2>/dev/null || true)
  if [ -n "$DOCKER_VERSION" ]; then
    add_requirement "docker" "Docker" "pass" "$DOCKER_VERSION"
  else
    add_requirement "docker" "Docker" "pass" "Docker CLI detected."
  fi
else
  add_requirement "docker" "Docker" "fail" "Docker CLI not found."
fi

compose_message="Docker Compose not found. Install Docker Compose V2 (the \"docker compose\" plugin)."
compose_status="fail"

extract_major_version() {
  echo "$1" | sed -E 's/^v?([0-9]+).*/\1/'
}

if [ "$docker_present" = true ] && docker compose version >/dev/null 2>&1; then
  COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || docker compose version 2>/dev/null | head -n 1)
  COMPOSE_MAJOR=$(extract_major_version "$COMPOSE_VERSION")
  if [[ "$COMPOSE_MAJOR" =~ ^[0-9]+$ && "$COMPOSE_MAJOR" -ge 2 ]]; then
    compose_status="pass"
    if [ -n "$COMPOSE_VERSION" ]; then
      compose_message="Docker Compose plugin ${COMPOSE_VERSION}"
    else
      compose_message="Docker Compose plugin detected."
    fi
  else
    compose_status="fail"
    compose_message="Docker Compose plugin ${COMPOSE_VERSION:-unknown} detected. Version 2 or newer is required."
  fi
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_VERSION=$(docker-compose --version 2>/dev/null || true)
  COMPOSE_MAJOR=$(extract_major_version "$COMPOSE_VERSION")
  if [[ "$COMPOSE_MAJOR" =~ ^[0-9]+$ && "$COMPOSE_MAJOR" -ge 2 ]]; then
    compose_status="pass"
    compose_message="${COMPOSE_VERSION:-docker-compose command available.}"
  else
    compose_status="fail"
    compose_message="Legacy docker-compose ${COMPOSE_VERSION:-version unknown} detected. Install Docker Compose V2 and use the 'docker compose' command to avoid errors such as KeyError: 'ContainerConfig'."
  fi
fi

add_requirement "docker_compose" "Docker Compose" "$compose_status" "$compose_message"

# Verify Git
if command -v git >/dev/null 2>&1; then
  GIT_VERSION=$(git --version 2>/dev/null || true)
  if [ -n "$GIT_VERSION" ]; then
    add_requirement "git" "Git" "pass" "$GIT_VERSION"
  else
    add_requirement "git" "Git" "pass" "Git executable detected."
  fi
else
  add_requirement "git" "Git" "fail" "Git executable not found."
fi

check_database_connection
check_smtp_configuration
check_single_env "app_name" "Application name" "APP_NAME"
check_logo_path

if [ "$all_ok" = true ]; then
  SUMMARY="All prerequisites met."
else
  SUMMARY="One or more prerequisites are missing. Please review the list above."
fi

if [ "${#requirements[@]}" -gt 0 ]; then
  printf -v joined '%s,' "${requirements[@]}"
  joined=${joined%,}
else
  joined=''
fi

SUMMARY_ESCAPED=$(escape_json "$SUMMARY")
OVERALL=$([ "$all_ok" = true ] && echo "true" || echo "false")

printf '{'
printf '"ok": %s,' "$OVERALL"
printf '"allPassed": %s,' "$OVERALL"
printf '"summary": "%s",' "$SUMMARY_ESCAPED"
printf '"requirements": [%s]' "$joined"
printf '}'
printf '\n'

if [ "$all_ok" = true ]; then
  exit 0
else
  exit 1
fi
