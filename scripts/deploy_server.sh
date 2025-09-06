#!/usr/bin/env bash
set -euo pipefail

export NODE_ENV=production

# Script to configure nginx for a provided domain and obtain Let's Encrypt certificates.
# Usage: ./scripts/deploy_server.sh <domain>

if [[ $EUID -ne 0 ]]; then
  echo "This script must be run as root." >&2
  exit 1
fi

DOMAIN=${1:-}
if [[ -z "$DOMAIN" ]]; then
  echo "Usage: $0 <domain>" >&2
  exit 1
fi

BARE_DOMAIN=${DOMAIN#www.}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
DEFAULT_CONF="$REPO_ROOT/nginx/conf.d/default.conf"
SSL_CONF="$REPO_ROOT/nginx/conf.d/ssl.conf"

echo "Setting APP_DOMAIN to $BARE_DOMAIN"
export APP_DOMAIN="$BARE_DOMAIN"

# Obtain certificates using certbot or acme.sh
CERT_PATH="/etc/letsencrypt/live/${BARE_DOMAIN}"
mkdir -p "$CERT_PATH"
if command -v certbot >/dev/null 2>&1; then
  certbot certonly --non-interactive --agree-tos --nginx -d "$BARE_DOMAIN" -d "www.$BARE_DOMAIN" -m "admin@${BARE_DOMAIN}"
elif command -v acme.sh >/dev/null 2>&1; then
  acme.sh --issue -d "$BARE_DOMAIN" -d "www.$BARE_DOMAIN" --webroot /var/www/html
  acme.sh --install-cert -d "$BARE_DOMAIN" \
    --key-file       "$CERT_PATH/privkey.pem" \
    --fullchain-file "$CERT_PATH/fullchain.pem"
else
  echo "Neither certbot nor acme.sh is installed." >&2
  exit 1
fi

if command -v systemctl >/dev/null 2>&1; then
  systemctl reload nginx
elif command -v nginx >/dev/null 2>&1; then
  nginx -s reload
fi
echo "Certificates installed to $CERT_PATH"
