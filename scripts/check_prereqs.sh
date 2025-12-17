#!/usr/bin/env bash
set -u

STATUS="ok"

emit_result() {
  local status="$1"
  local label="$2"
  local detail="$3"
  echo "RESULT|${status}|${label}|${detail}"
  if [ "${status}" != "ok" ]; then
    STATUS="fail"
  fi
}

# Node.js
if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node -v 2>/dev/null || echo "")
  NODE_MAJOR=$(echo "${NODE_VERSION}" | sed -E 's/^v([0-9]+).*/\1/')
  if [ -n "${NODE_MAJOR}" ] && [ "${NODE_MAJOR}" -ge 18 ]; then
    emit_result "ok" "Node.js" "Detected ${NODE_VERSION}"
  else
    emit_result "fail" "Node.js" "Requires version 18 or newer (detected ${NODE_VERSION:-unknown})"
  fi
else
  emit_result "fail" "Node.js" "Node.js 18 or newer is required."
fi

# Docker
if command -v docker >/dev/null 2>&1; then
  DOCKER_INFO=$(docker --version 2>/dev/null || echo "Docker CLI available")
  emit_result "ok" "Docker" "${DOCKER_INFO}"
else
  emit_result "fail" "Docker" "Docker is required. Install Docker Engine."
fi

# Docker Compose
if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_INFO=$(docker-compose --version 2>/dev/null || echo "docker-compose available")
  emit_result "ok" "Docker Compose" "${COMPOSE_INFO}"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_PLUGIN_INFO=$(docker compose version 2>/dev/null | head -n 1 | tr -d '\r')
  emit_result "ok" "Docker Compose" "${COMPOSE_PLUGIN_INFO:-docker compose plugin available}"
else
  emit_result "fail" "Docker Compose" "Docker Compose (v2 plugin or binary) is required."
fi

# Git
if command -v git >/dev/null 2>&1; then
  GIT_INFO=$(git --version 2>/dev/null || echo "Git CLI available")
  emit_result "ok" "Git" "${GIT_INFO}"
else
  emit_result "fail" "Git" "Git is required."
fi

echo "SUMMARY|${STATUS}"
exit 0
