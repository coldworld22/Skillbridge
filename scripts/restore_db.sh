#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/restore_db.sh --input <file> [--tenant-id <uuid>]

Options:
  --input <file>      SQL backup file to restore.
  --tenant-id <uuid>  Expected tenant ID for tenant-scoped backups.
  -h, --help          Show this help message.
EOF
}

INPUT=""
TENANT_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --input)
      INPUT="${2:-}"
      shift 2
      ;;
    --tenant-id)
      TENANT_ID="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$INPUT" ]]; then
  echo "Missing required --input value." >&2
  usage
  exit 1
fi

if [[ ! -f "$INPUT" ]]; then
  echo "Input file not found: $INPUT" >&2
  exit 1
fi

if [[ -n "$TENANT_ID" ]]; then
  if [[ ! "$TENANT_ID" =~ ^[0-9a-fA-F-]{36}$ ]]; then
    echo "Invalid tenant ID format; expected UUID." >&2
    exit 1
  fi
fi

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
else
  DOCKER_COMPOSE="docker compose"
fi

DB_URL="${DATABASE_URL:-}"

run_psql() {
  if [[ -n "$DB_URL" ]]; then
    psql "$DB_URL" "$@"
  elif $DOCKER_COMPOSE ps -q db >/dev/null 2>&1; then
    $DOCKER_COMPOSE exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"
  else
    echo "DATABASE_URL is not set and no docker compose db service is running." >&2
    exit 1
  fi
}

file_tenant_id=$(awk '/^-- tenant_id:/ {print $3; exit}' "$INPUT" || true)
if [[ -n "$file_tenant_id" ]]; then
  if [[ -z "$TENANT_ID" ]]; then
    echo "Tenant-scoped backup detected. Provide --tenant-id $file_tenant_id to confirm restore." >&2
    exit 1
  fi
  if [[ "$file_tenant_id" != "$TENANT_ID" ]]; then
    echo "Tenant ID mismatch: file expects $file_tenant_id, received $TENANT_ID." >&2
    exit 1
  fi
fi

run_psql -v ON_ERROR_STOP=1 -f "$INPUT"
echo "Restore completed from $INPUT"
