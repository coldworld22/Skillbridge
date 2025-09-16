#!/usr/bin/env bash
set -euo pipefail

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
  local name="$2"
  local status="$3"
  local message="$4"

  local escaped_name
  escaped_name=$(escape_json "$name")
  local escaped_message
  escaped_message=$(escape_json "$message")

  requirements+=("{\"id\":\"$id\",\"name\":\"$escaped_name\",\"status\":\"$status\",\"message\":\"$escaped_message\"}")

  if [ "$status" != "pass" ]; then
    all_ok=false
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

docker_compose_status=false
if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_VERSION=$(docker-compose --version 2>/dev/null || true)
  if [ -n "$COMPOSE_VERSION" ]; then
    add_requirement "docker_compose" "Docker Compose" "pass" "$COMPOSE_VERSION"
  else
    add_requirement "docker_compose" "Docker Compose" "pass" "docker-compose command available."
  fi
elif [ "$docker_present" = true ] && docker compose version >/dev/null 2>&1; then
  COMPOSE_VERSION=$(docker compose version 2>/dev/null | head -n 1)
  if [ -n "$COMPOSE_VERSION" ]; then
    add_requirement "docker_compose" "Docker Compose" "pass" "$COMPOSE_VERSION"
  else
    add_requirement "docker_compose" "Docker Compose" "pass" "Docker Compose plugin available."
  fi
else
  add_requirement "docker_compose" "Docker Compose" "fail" "Docker Compose not found."
fi

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
printf '"summary": "%s",' "$SUMMARY_ESCAPED"
printf '"requirements": [%s]' "$joined"
printf '}'
printf '\n'

if [ "$all_ok" = true ]; then
  exit 0
else
  exit 1
fi
