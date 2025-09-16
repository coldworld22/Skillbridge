#!/usr/bin/env bash
set -euo pipefail

declare -A errors
declare -A details

json_escape() {
  local str="$1"
  local escaped=""
  local i char
  for ((i = 0; i < ${#str}; i++)); do
    char="${str:i:1}"
    case "$char" in
      '\\')
        escaped+="\\\\"
        ;;
      '"')
        escaped+="\\\""
        ;;
      $'\n')
        escaped+="\\n"
        ;;
      $'\r')
        ;;
      *)
        escaped+="$char"
        ;;
    esac
  done
  printf '%s' "$escaped"
}

build_json_object() {
  local -n arr=$1
  local first=1
  printf '{'
  if [ ${#arr[@]} -gt 0 ]; then
    while IFS= read -r key; do
      local value="${arr[$key]}"
      if [ $first -eq 0 ]; then
        printf ','
      else
        first=0
      fi
      printf '"%s":"%s"' "$(json_escape "$key")" "$(json_escape "$value")"
    done < <(printf '%s\n' "${!arr[@]}" | sort)
  fi
  printf '}'
}

record_status() {
  local key="$1"
  local status="$2"
  details["$key"]="$status"
}

# Verify Node.js
if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node -v 2>/dev/null | tr -d '\r\n')
  NODE_MAJOR=$(echo "$NODE_VERSION" | sed -E 's/^v([0-9]+).*/\1/')
  if [[ "$NODE_MAJOR" =~ ^[0-9]+$ ]] && [ "$NODE_MAJOR" -ge 18 ]; then
    record_status node "ok"
  else
    record_status node "version_too_old"
    if [ -n "${NODE_VERSION:-}" ]; then
      errors["node"]="Node.js version 18 or higher is required (detected ${NODE_VERSION})."
    else
      errors["node"]="Node.js version 18 or higher is required."
    fi
  fi
else
  record_status node "missing"
  errors["node"]="Node.js 18+ is required but was not found on this system."
fi

# Verify Docker
if command -v docker >/dev/null 2>&1; then
  record_status docker "ok"
else
  record_status docker "missing"
  errors["docker"]="Docker CLI is required but was not found. Install Docker Desktop or Docker Engine."
fi

# Verify Docker Compose
if command -v docker-compose >/dev/null 2>&1; then
  record_status dockerCompose "ok"
elif docker compose version >/dev/null 2>&1; then
  record_status dockerCompose "ok"
else
  record_status dockerCompose "missing"
  errors["dockerCompose"]="Docker Compose v2 is required but was not detected. Ensure the Docker Compose plugin is installed."
fi

# Verify Git
if command -v git >/dev/null 2>&1; then
  record_status git "ok"
else
  record_status git "missing"
  errors["git"]="Git is required but was not found on this system."
fi

ok="true"
exit_code=0
if [ ${#errors[@]} -gt 0 ]; then
  ok="false"
  exit_code=1
fi

errors_json=$(build_json_object errors)
details_json=$(build_json_object details)
printf '{"ok":%s,"errors":%s,"details":%s}\n' "$ok" "$errors_json" "$details_json"

exit $exit_code
