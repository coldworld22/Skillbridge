#!/usr/bin/env bash
set -e

json_escape() {
  local str="$1"
  str=${str//\\/\\\\}
  str=${str//"/\\"}
  str=${str//$'\n'/\\n}
  str=${str//$'\r'/\\r}
  str=${str//$'\t'/\\t}
  printf '%s' "$str"
}

all_passed=true

# Verify Node.js
node_passed=false
node_message="Node.js is required. Please install Node.js 18 or newer."
if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node -v)
  NODE_MAJOR=$(printf '%s' "$NODE_VERSION" | sed -E 's/^v([0-9]+).*/\1/')
  if [ "$NODE_MAJOR" -ge 18 ]; then
    node_passed=true
    node_message="Node.js ${NODE_VERSION} detected."
  else
    node_message="Node.js version 18 or higher is required. Current version: ${NODE_VERSION}."
  fi
fi
if [ "$node_passed" != true ]; then
  all_passed=false
fi

# Verify Docker
docker_passed=false
docker_message="Docker is required. Please install Docker."
if command -v docker >/dev/null 2>&1; then
  docker_passed=true
  docker_version=$(docker --version 2>/dev/null | head -n 1)
  if [ -n "$docker_version" ]; then
    docker_message="$docker_version"
  else
    docker_message="Docker is installed."
  fi
fi
if [ "$docker_passed" != true ]; then
  all_passed=false
fi

# Verify Docker Compose
docker_compose_passed=false
docker_compose_message="Docker Compose is required. Please install Docker Compose."
if command -v docker-compose >/dev/null 2>&1; then
  docker_compose_passed=true
  docker_compose_version=$(docker-compose --version 2>/dev/null | head -n 1)
  if [ -n "$docker_compose_version" ]; then
    docker_compose_message="$docker_compose_version"
  else
    docker_compose_message="Docker Compose is installed."
  fi
elif docker compose version >/dev/null 2>&1; then
  docker_compose_passed=true
  docker_compose_version=$(docker compose version 2>/dev/null | head -n 1)
  if [ -n "$docker_compose_version" ]; then
    docker_compose_message="$docker_compose_version"
  else
    docker_compose_message="Docker Compose (via docker CLI) is available."
  fi
fi
if [ "$docker_compose_passed" != true ]; then
  all_passed=false
fi

# Verify Git
git_passed=false
git_message="Git is required. Please install Git."
if command -v git >/dev/null 2>&1; then
  git_passed=true
  git_version=$(git --version 2>/dev/null | head -n 1)
  if [ -n "$git_version" ]; then
    git_message="$git_version"
  else
    git_message="Git is installed."
  fi
fi
if [ "$git_passed" != true ]; then
  all_passed=false
fi

node_message_escaped=$(json_escape "$node_message")
docker_message_escaped=$(json_escape "$docker_message")
docker_compose_message_escaped=$(json_escape "$docker_compose_message")
git_message_escaped=$(json_escape "$git_message")

printf '{\n'
printf '  "node": {"passed": %s, "message": "%s"},\n' "$node_passed" "$node_message_escaped"
printf '  "docker": {"passed": %s, "message": "%s"},\n' "$docker_passed" "$docker_message_escaped"
printf '  "dockerCompose": {"passed": %s, "message": "%s"},\n' "$docker_compose_passed" "$docker_compose_message_escaped"
printf '  "git": {"passed": %s, "message": "%s"},\n' "$git_passed" "$git_message_escaped"
printf '  "allPassed": %s\n' "$all_passed"
printf '}\n'
