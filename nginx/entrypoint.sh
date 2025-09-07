#!/bin/sh
set -e

SERVER_NAME="_"
if [ -n "$APP_DOMAIN" ]; then
  SERVER_NAME="$APP_DOMAIN www.$APP_DOMAIN"
fi

export SERVER_NAME APP_DOMAIN

envsubst '$SERVER_NAME $APP_DOMAIN' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
envsubst '$SERVER_NAME $APP_DOMAIN' < /etc/nginx/templates/ssl.conf.template > /etc/nginx/conf.d/ssl.conf

exec "$@"
