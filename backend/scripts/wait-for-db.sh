#!/bin/sh
set -eu

MAX_ATTEMPTS=${DB_MAX_WAIT_ATTEMPTS:-30}
SLEEP_SECONDS=${DB_WAIT_INTERVAL_SECONDS:-2}

resolve_from_database_url() {
  key="$1"
  node -e "
    const value = new URL(process.argv[1]);
    const pathname = value.pathname ? value.pathname.replace(/^\//, '') : '';
    const map = {
      host: value.hostname || 'db',
      port: value.port || '5432',
      user: value.username || 'postgres',
      password: value.password || '',
      database: pathname || ''
    };
    process.stdout.write(map['$key'] ?? '');
  " "$DATABASE_URL"
}

if [ -n "${DATABASE_URL:-}" ]; then
  DB_HOST=$(resolve_from_database_url host)
  DB_PORT=$(resolve_from_database_url port)
  DB_USER=$(resolve_from_database_url user)
  DB_PASSWORD=$(resolve_from_database_url password)
  DB_NAME=$(resolve_from_database_url database)
else
  DB_HOST=${POSTGRES_HOST:-db}
  DB_PORT=${POSTGRES_PORT:-5432}
  DB_USER=${POSTGRES_USER:-postgres}
  DB_PASSWORD=${POSTGRES_PASSWORD:-}
  DB_NAME=${POSTGRES_DB:-}
fi

DB_NAME=${DB_NAME:-${POSTGRES_DB:-postgres}}

if [ -n "$DB_PASSWORD" ]; then
  export PGPASSWORD="$DB_PASSWORD"
fi

attempt=0

if command -v pg_isready >/dev/null 2>&1; then
  while true; do
    if output=$(pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" ${DB_NAME:+-d "$DB_NAME"} 2>&1); then
      break
    fi

    attempt=$((attempt + 1))
    if [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
      echo "ERROR: Unable to verify PostgreSQL at $DB_HOST:$DB_PORT for user $DB_USER after $MAX_ATTEMPTS attempts." >&2
      echo "       Last error: $output" >&2
      echo "       Check that the credentials match your database configuration." >&2
      exit 1
    fi

    echo "Waiting for database at $DB_HOST:$DB_PORT (database $DB_NAME) (attempt ${attempt}/${MAX_ATTEMPTS})... $output"
    sleep "$SLEEP_SECONDS"
  done
else
  echo "pg_isready not available; falling back to TCP probe for $DB_HOST:$DB_PORT (database $DB_NAME)."
  while true; do
    if nc -z "$DB_HOST" "$DB_PORT"; then
      break
    fi

    attempt=$((attempt + 1))
    if [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
      echo "ERROR: Database port $DB_PORT on $DB_HOST did not open after $MAX_ATTEMPTS attempts." >&2
      echo "       Verify that the Postgres container is running and reachable." >&2
      exit 1
    fi

    echo "Waiting for database port $DB_PORT on $DB_HOST (database $DB_NAME) (attempt ${attempt}/${MAX_ATTEMPTS})..."
    sleep "$SLEEP_SECONDS"
  done
fi

echo "Database is up!"
