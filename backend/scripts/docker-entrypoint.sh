#!/bin/sh
set -eu

ensure_upload_dirs() {
  if [ "$(id -u)" -ne 0 ]; then
    return
  fi

  base_dir="/app/uploads"
  mkdir -p "$base_dir"

  for dir in \
    app \
    languages \
    certificateTemplates \
    demo-videos \
    chat \
    groups \
    payment-methods \
    payment-receipts \
    invoices \
    books \
    ads \
    avatars \
    avatars/student \
    avatars/instructor \
    identity/student \
    admin \
    admin/avatars \
    admin/identity \
    categories \
    currencies \
    community \
    lessons \
    classes \
    blog \
    demos/instructor \
    certificates/instructor \
    tutorials \
    tutorials/chapters \
    support_attachments \
    ticket_attachments \
    seo; do
    mkdir -p "$base_dir/$dir"
  done

  chown -R node:node "$base_dir"
}

run_as_node() {
  if [ "$(id -u)" -eq 0 ]; then
    su-exec node "$@"
  else
    "$@"
  fi
}

url_encode() {
  node -e "process.stdout.write(encodeURIComponent(process.argv[1] ?? ''));" "$1"
}

derive_database_url() {
  if [ "${SKIP_DB_URL_DERIVATION:-false}" = "true" ]; then
    return
  fi

  if [ -z "${POSTGRES_USER:-}" ] || [ -z "${POSTGRES_PASSWORD:-}" ] || [ -z "${POSTGRES_DB:-}" ]; then
    return
  fi

  host=${POSTGRES_HOST:-db}
  port=${POSTGRES_PORT:-5432}
  encoded_user=$(url_encode "$POSTGRES_USER")
  encoded_password=$(url_encode "$POSTGRES_PASSWORD")
  derived_url="postgres://${encoded_user}:${encoded_password}@${host}:${port}/${POSTGRES_DB}"

  if [ -n "${DATABASE_URL:-}" ] && [ "$DATABASE_URL" != "$derived_url" ]; then
    echo "INFO: Overriding DATABASE_URL to match POSTGRES_* values. Set SKIP_DB_URL_DERIVATION=true to keep the original value."
  fi

  export DATABASE_URL="$derived_url"
}

should_run_migrations() {
  case "${RUN_DB_MIGRATIONS:-true}" in
    false|FALSE|0|no|NO)
      return 1
      ;;
    *)
      return 0
      ;;
  esac
}

should_wait_for_db() {
  if [ "${WAIT_FOR_DB:-auto}" = "always" ]; then
    return 0
  fi

  if [ "$1" = "node" ] && [ "${2:-}" = "src/server.js" ]; then
    return 0
  fi

  return 1
}

prepare_upload_dirs() {
  mkdir -p /app/uploads/app /app/uploads/languages
  chown -R node:node /app/uploads
}

main() {
  derive_database_url

  if [ "$#" -eq 0 ]; then
    set -- node src/server.js
  fi

  if should_wait_for_db "$1" "$2"; then
    ./scripts/wait-for-db.sh
  fi

  if [ "$1" = "node" ] && [ "${2:-}" = "src/server.js" ]; then
    if should_run_migrations; then
      run_as_node npx knex migrate:latest
    else
      echo "Skipping automatic database migrations because RUN_DB_MIGRATIONS=${RUN_DB_MIGRATIONS}."
    fi

    prepare_upload_dirs
  fi

  if [ "$(id -u)" -eq 0 ]; then
    ensure_upload_dirs
    exec su-exec node "$@"
  fi

  exec "$@"

}

main "$@"
