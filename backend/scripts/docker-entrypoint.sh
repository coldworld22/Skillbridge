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

  mkdir -p /app/data
  chown -R node:node /app/data

  mkdir -p /app/logs
  chown -R node:node /app/logs
}

ensure_critical_migrations() {
  missing=""
  for migration in \
    /app/src/migrations/20250930160000_alter_verifications_code_to_varchar255.js \
    /app/src/migrations/20250930160010_alter_verifications_code_to_text.js; do
    if [ ! -f "$migration" ]; then
      missing="$missing\n  - ${migration#/app/}"
    fi
  done

  if [ -n "$missing" ]; then
    cat >&2 <<EOF
ERROR: Critical database migrations are missing from the container image:
$missing

The backend cannot start safely without them. Rebuild the backend image to
refresh the bundled migrations, for example:

  docker compose build backend && docker compose up -d backend

If you are running in production, ensure the deployment pipeline copies the
backend/src/migrations directory into the build context before building the
image.
EOF
    exit 1
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

ensure_required_migrations() {
  missing_files=""
  for migration in \
    /app/src/migrations/20250930160000_alter_verifications_code_to_varchar255.js \
    /app/src/migrations/20250930160010_alter_verifications_code_to_text.js; do
    if [ ! -f "$migration" ]; then
      missing_files="${missing_files}\n  $(basename "$migration")"
    fi
  done

  if [ -n "$missing_files" ]; then
    cat >&2 <<EOF
ERROR: The backend container is missing the following critical migration files:${missing_files}

This usually means the backend image was built without copying backend/src/migrations.
Rebuild the backend image (for example: 'docker compose build backend' or
'docker-compose build backend') and then redeploy with 'docker compose up -d'.
EOF
    exit 1
  fi
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
    ensure_critical_migrations
    if should_run_migrations; then
      ensure_required_migrations
      run_as_node npx knex migrate:latest
    else
      echo "Skipping automatic database migrations because RUN_DB_MIGRATIONS=${RUN_DB_MIGRATIONS}."
    fi

    prepare_upload_dirs
  fi

  run_as_node "$@"

}

main "$@"
