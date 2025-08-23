#!/usr/bin/env bash
set -euo pipefail

# Basic installation script.
# Usage: ./install.sh [development|production] [domain]

MODE=${1:-development}
DOMAIN=${2:-}

if [[ "$MODE" == "production" ]]; then
  if [[ -z "$DOMAIN" ]]; then
    echo "Usage: $0 production <domain>" >&2
    exit 1
  fi
  echo "Running server deployment for $DOMAIN"
  ./scripts/deploy_server.sh "$DOMAIN"
else
  echo "Running in development mode; no deployment actions performed."
fi
