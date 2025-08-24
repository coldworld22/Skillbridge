#!/usr/bin/env bash
set -euo pipefail

# Script to configure nginx for a provided domain and obtain Let's Encrypt certificates.
# Usage: ./scripts/deploy_server.sh <domain>

DOMAIN=${1:-}
if [[ -z "$DOMAIN" ]]; then
  echo "Usage: $0 <domain>" >&2
  exit 1
fi

BARE_DOMAIN=${DOMAIN#www.}
DEFAULT_CONF="nginx/conf.d/default.conf"
SSL_CONF="nginx/conf.d/ssl.conf"

# Replace domain placeholders in nginx config
for file in "$DEFAULT_CONF" "$SSL_CONF"; do
  if [[ -f "$file" ]]; then
    sed -i "s/www.eduskillbridge.net/www.${BARE_DOMAIN}/g" "$file"
    sed -i "s/eduskillbridge.net/${BARE_DOMAIN}/g" "$file"
  fi
done

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

echo "Certificates installed to $CERT_PATH"
