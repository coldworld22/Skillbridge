#!/usr/bin/env bash
set -euo pipefail

# Basic installation script.
# Usage: ./install.sh [development|production] [domain]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

MODE=${1:-}
DOMAIN=${2:-}
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
INSTALL_CONFIG_PATH="${INSTALL_CONFIG_PATH:-}"

if [[ -z "$MODE" ]]; then
  if [[ -t 0 ]]; then
    echo "Welcome to the SkillBridge installation wizard."
    read -rp "Choose mode ([d]evelopment/[p]roduction) [development]: " MODE_INPUT
    case "$MODE_INPUT" in
      ""|d|development) MODE=development ;;
      p|production) MODE=production ;;
      *) echo "Invalid selection: $MODE_INPUT" >&2; exit 1 ;;
    esac
  else
    MODE=development
  fi
fi

if [[ "$MODE" == "production" && -z "$DOMAIN" ]]; then
  if [[ -t 0 ]]; then
    read -rp "Enter domain (e.g., example.com): " DOMAIN
  else
    echo "Domain is required for production" >&2
    exit 1
  fi
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

if [[ -z "$ADMIN_EMAIL" ]]; then
  if [[ -t 0 ]]; then
    read -rp "Enter admin email: " ADMIN_EMAIL
  else
    echo "ADMIN_EMAIL must be provided when running non-interactively." >&2
    exit 1
  fi
fi

if [[ -z "$ADMIN_PASSWORD" ]]; then
  if [[ -t 0 ]]; then
    read -rsp "Enter admin password: " ADMIN_PASSWORD
    echo
  else
    echo "ADMIN_PASSWORD must be provided when running non-interactively." >&2
    exit 1
  fi
fi

export ADMIN_EMAIL ADMIN_PASSWORD

echo "Provisioning initial admin account..."
node "$SCRIPT_DIR/backend/scripts/create-admin.js"

APPLY_CONFIG_SCRIPT="$SCRIPT_DIR/backend/scripts/apply-installer-config.js"

if [[ -n "$INSTALL_CONFIG_PATH" ]]; then
  if [[ ! -f "$INSTALL_CONFIG_PATH" ]]; then
    echo "Installer configuration file not found: $INSTALL_CONFIG_PATH" >&2
    exit 1
  fi

  if [[ -f "$APPLY_CONFIG_SCRIPT" ]]; then
    echo "Applying installer configuration..."
    if ! node "$APPLY_CONFIG_SCRIPT" "$INSTALL_CONFIG_PATH"; then
      echo "Failed to apply installer configuration" >&2
      exit 1
    fi
  else
    echo "Warning: apply-installer-config script missing at $APPLY_CONFIG_SCRIPT" >&2
  fi
fi
