#!/bin/sh
set -eu

run_as_node() {
  if [ "$(id -u)" -eq 0 ]; then
    exec_cmd="su-exec"
    if ! command -v "$exec_cmd" >/dev/null 2>&1; then
      echo "ERROR: $exec_cmd not found. Ensure it is installed in the container image." >&2
      exit 1
    fi
    "$exec_cmd" node "$@"
  else
    "$@"
  fi
}

ensure_upload_permissions() {
  if [ "$(id -u)" -ne 0 ]; then
    return
  fi

  upload_dirs="
/app/uploads
/app/uploads/ads
/app/uploads/admin
/app/uploads/admin/avatars
/app/uploads/admin/identity
/app/uploads/app
/app/uploads/avatars
/app/uploads/avatars/instructor
/app/uploads/avatars/student
/app/uploads/books
/app/uploads/certificateTemplates
/app/uploads/certificates
/app/uploads/certificates/instructor
/app/uploads/chat
/app/uploads/currencies
/app/uploads/demo-videos
/app/uploads/demos
/app/uploads/demos/instructor
/app/uploads/groups
/app/uploads/identity
/app/uploads/identity/student
/app/uploads/invoices
/app/uploads/languages
/app/uploads/payment-methods
/app/uploads/payment-receipts
/app/uploads/seo
/app/uploads/support_attachments
/app/uploads/ticket_attachments
/app/uploads/tutorials
/app/uploads/tutorials/chapters
/app/uploads/tutorials/chapters/instructor
/app/uploads/tutorials/chapters/student
"

  for dir in $upload_dirs; do
    mkdir -p "$dir"
  done

  chown -R node:node /app/uploads
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

main() {
  ensure_upload_permissions

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
  fi

  if [ "$(id -u)" -eq 0 ]; then
    exec su-exec node "$@"
  fi

  exec "$@"
}

main "$@"
