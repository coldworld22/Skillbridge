#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

requirements=()
all_ok=true
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
# Common helper for CLI tools where only presence/version check is required
check_cli_tool() {
  local id="$1"
  local name="$2"
  local command="$3"
  local version_flag="${4---version}"

  if command -v "$command" >/dev/null 2>&1; then
    local version
    version=$("$command" "$version_flag" 2>/dev/null || true)
    if [ -n "$version" ]; then
      add_requirement "$id" "$name" "pass" "Detected ${version}"
    else
      add_requirement "$id" "$name" "pass" "${name} executable detected."
    fi
  else
    add_requirement "$id" "$name" "fail" "${name} executable not found."
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

# Verify npm, Yarn, pnpm, and Python
check_cli_tool "npm" "npm" "npm" "--version"
check_cli_tool "yarn" "Yarn" "yarn" "--version"
check_cli_tool "pnpm" "pnpm" "pnpm" "--version"

python_cmd=""
if command -v python3 >/dev/null 2>&1; then
  python_cmd="python3"
elif command -v python >/dev/null 2>&1; then
  python_cmd="python"
fi

if [ -n "$python_cmd" ]; then
  PYTHON_VERSION=$($python_cmd --version 2>&1 || true)
  if [ -n "$PYTHON_VERSION" ]; then
    add_requirement "python" "Python" "pass" "Detected ${PYTHON_VERSION}"
  else
    add_requirement "python" "Python" "pass" "${python_cmd} executable detected."
  fi
else
  add_requirement "python" "Python" "fail" "Python executable not found."
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

# Verify PostgreSQL service
check_postgres() {
  if command -v pg_isready >/dev/null 2>&1; then
    local output status_code
    status_code=0
    output=$(pg_isready 2>&1) || status_code=$?
    if [ "$status_code" -eq 0 ]; then
      add_requirement "postgres" "PostgreSQL" "pass" "pg_isready: ${output}"
      return
    fi

    if [ -n "$output" ]; then
      add_requirement "postgres" "PostgreSQL" "fail" "$output"
    else
      add_requirement "postgres" "PostgreSQL" "fail" "pg_isready reported PostgreSQL as unavailable."
    fi
    return
  fi

  if command -v psql >/dev/null 2>&1; then
    local output status_code
    status_code=0
    output=$(PGCONNECT_TIMEOUT=2 psql -Atqc 'SELECT 1' 2>&1) || status_code=$?
    if [ "$status_code" -eq 0 ]; then
      add_requirement "postgres" "PostgreSQL" "pass" "psql connected successfully."
    else
      if [ -n "$output" ]; then
        add_requirement "postgres" "PostgreSQL" "fail" "$output"
      else
        add_requirement "postgres" "PostgreSQL" "fail" "psql could not connect to PostgreSQL."
      fi
    fi
    return
  fi

  add_requirement "postgres" "PostgreSQL" "fail" "Neither pg_isready nor psql were found. Install the PostgreSQL client tools."
}

check_redis() {
  if ! command -v redis-cli >/dev/null 2>&1; then
    add_requirement "redis" "Redis" "fail" "redis-cli executable not found."
    return
  fi

  local redis_output redis_status
  redis_status=0
  redis_output=$(redis-cli ping 2>&1) || redis_status=$?

  if [ "$redis_status" -eq 0 ] && echo "$redis_output" | grep -qi 'PONG'; then
    add_requirement "redis" "Redis" "pass" "redis-cli ping: ${redis_output}"
  else
    if [ -n "$redis_output" ]; then
      add_requirement "redis" "Redis" "fail" "$redis_output"
    else
      add_requirement "redis" "Redis" "fail" "redis-cli could not reach a Redis instance."
    fi
  fi
}

check_postgres
check_redis

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
