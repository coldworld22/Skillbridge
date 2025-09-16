#!/usr/bin/env bash
set -u -o pipefail

declare -a result_ids=()
declare -a result_names=()
declare -a result_ok=()
declare -a result_messages=()
declare -a result_versions=()
overall_ok=true

json_escape() {
  local str="${1-}"
  local backslash='\\'
  local double_quote='"'
  str=${str//${backslash}/${backslash}${backslash}}
  str=${str//${double_quote}/${backslash}${double_quote}}
  str=${str//$'\n'/\n}
  str=${str//$'\r'/\r}
  str=${str//$'\t'/\t}
  printf '%s' "$str"
}

add_result() {
  local id="$1"
  local name="$2"
  local ok="$3"
  local message="$4"
  local version="${5-}"

  result_ids+=("$id")
  result_names+=("$name")
  result_ok+=("$ok")
  result_messages+=("$message")
  result_versions+=("$version")
  if [ "$ok" != "true" ]; then
    overall_ok=false
  fi
}

# Verify Node.js
if command -v node >/dev/null 2>&1; then
  node_version=$(node -v 2>&1 || true)
  if [[ "$node_version" =~ ^v([0-9]+) ]]; then
    node_major=${BASH_REMATCH[1]}
  else
    node_major=0
  fi
  if [ "$node_major" -ge 18 ] 2>/dev/null; then
    add_result "node" "Node.js" "true" "Node.js ${node_version} detected." "$node_version"
  else
    add_result "node" "Node.js" "false" "Node.js version 18 or higher is required. Current version: ${node_version}" "$node_version"
  fi
else
  add_result "node" "Node.js" "false" "Node.js is required. Please install Node.js 18 or newer."
fi

# Verify Docker
if command -v docker >/dev/null 2>&1; then
  docker_version=$(docker --version 2>&1 || true)
  add_result "docker" "Docker" "true" "Docker detected." "$docker_version"
else
  add_result "docker" "Docker" "false" "Docker is required. Please install Docker."
fi

# Verify Docker Compose
if command -v docker-compose >/dev/null 2>&1; then
  docker_compose_version=$(docker-compose version --short 2>/dev/null || docker-compose version 2>&1 || true)
  add_result "dockerCompose" "Docker Compose" "true" "Docker Compose detected." "$docker_compose_version"
elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  docker_compose_version=$(docker compose version 2>&1 | head -n 1)
  add_result "dockerCompose" "Docker Compose" "true" "Docker Compose plugin detected." "$docker_compose_version"
else
  add_result "dockerCompose" "Docker Compose" "false" "Docker Compose is required. Please install Docker Compose V2 or the docker-compose plugin."
fi

# Verify Git
if command -v git >/dev/null 2>&1; then
  git_version=$(git --version 2>&1 || true)
  add_result "git" "Git" "true" "Git detected." "$git_version"
else
  add_result "git" "Git" "false" "Git is required. Please install Git."
fi

printf '{\n'
if [ "$overall_ok" = true ]; then
  printf '  "ok": true,\n'
else
  printf '  "ok": false,\n'
fi
printf '  "requirements": [\n'
for ((i = 0; i < ${#result_ids[@]}; i++)); do
  if [ "$i" -ne 0 ] 2>/dev/null; then
    printf ',\n'
  fi
  id_escaped=$(json_escape "${result_ids[$i]}")
  name_escaped=$(json_escape "${result_names[$i]}")
  message_escaped=$(json_escape "${result_messages[$i]}")
  printf '    {"id":"%s","name":"%s","ok":%s,"message":"%s"' \
    "$id_escaped" "$name_escaped" "${result_ok[$i]}" "$message_escaped"
  if [ -n "${result_versions[$i]}" ]; then
    version_escaped=$(json_escape "${result_versions[$i]}")
    printf ',"version":"%s"' "$version_escaped"
  fi
  printf '}'
done
printf '\n  ]\n}\n'
