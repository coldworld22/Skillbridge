#!/usr/bin/env bash
set -e

# Verify Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Please install Node.js 18 or newer." >&2
  exit 1
fi
NODE_MAJOR=$(node -v | sed -E 's/^v([0-9]+).*/\1/')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Node.js version 18 or higher is required. Current version: $(node -v)" >&2
  exit 1
fi

# Verify Docker
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Please install Docker." >&2
  exit 1
fi

# Verify Docker Compose
if command -v docker-compose >/dev/null 2>&1; then
  :
elif docker compose version >/dev/null 2>&1; then
  :
else
  echo "Docker Compose is required. Please install Docker Compose." >&2
  exit 1
fi

# Verify Git
if ! command -v git >/dev/null 2>&1; then
  echo "Git is required. Please install Git." >&2
  exit 1
fi

echo "All prerequisites met."
