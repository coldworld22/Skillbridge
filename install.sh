#!/usr/bin/env bash
set -euo pipefail

# Basic installation script.
# Usage: ./install.sh [development|production] [domain]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

MODE=${1:-}
DOMAIN=${2:-}

if [[ -z "$MODE" ]]; then
  echo "Welcome to the SkillBridge installation wizard."
  read -rp "Choose mode ([d]evelopment/[p]roduction) [development]: " MODE_INPUT
  case "$MODE_INPUT" in
    ""|d|development) MODE=development ;;
    p|production) MODE=production ;;
    *) echo "Invalid selection: $MODE_INPUT" >&2; exit 1 ;;
  esac
fi

if [[ "$MODE" == "production" && -z "$DOMAIN" ]]; then
  read -rp "Enter domain (e.g., example.com): " DOMAIN
fi

if [[ "$MODE" == "production" ]]; then
  if [[ -z "$DOMAIN" ]]; then
    echo "Domain is required for production" >&2
    echo "Usage: $0 production <domain>" >&2
    exit 1
  fi
  echo "Running server deployment for $DOMAIN"
  "$SCRIPT_DIR/scripts/deploy_server.sh" "$DOMAIN"
else
  echo "Running in development mode; no deployment actions performed."
fi
