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

node_status=false
if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node -v 2>/dev/null)
  NODE_MAJOR=$(echo "$NODE_VERSION" | sed -E 's/^v([0-9]+).*/\1/')
  if [[ "$NODE_MAJOR" =~ ^[0-9]+$ ]] && [ "$NODE_MAJOR" -ge 18 ]; then
    node_status=true
  fi
fi

docker_status=false
if command -v docker >/dev/null 2>&1; then
  docker_status=true
fi

docker_compose_status=false
if command -v docker-compose >/dev/null 2>&1; then
  docker_compose_status=true
elif docker compose version >/dev/null 2>&1; then
  docker_compose_status=true
fi

git_status=false
if command -v git >/dev/null 2>&1; then
  git_status=true
fi
if [ "$git_passed" != true ]; then
  all_passed=false
fi

node_message_escaped=$(json_escape "$node_message")
docker_message_escaped=$(json_escape "$docker_message")
docker_compose_message_escaped=$(json_escape "$docker_compose_message")
git_message_escaped=$(json_escape "$git_message")


printf '{"node":%s,"docker":%s,"dockerCompose":%s,"git":%s}\n' \
  "$node_status" \
  "$docker_status" \
  "$docker_compose_status" \
  "$git_status"
