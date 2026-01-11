#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/backup_db.sh --output <file> [--tenant-id <uuid>]

Options:
  --output <file>     Destination SQL file.
  --tenant-id <uuid>  Scope backup to a single tenant (UUID).
  -h, --help          Show this help message.
EOF
}

OUTPUT=""
TENANT_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output)
      OUTPUT="${2:-}"
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

if [[ -z "$OUTPUT" ]]; then
  echo "Missing required --output value." >&2
  usage
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
  local query=$1
  if [[ -n "$DB_URL" ]]; then
    psql "$DB_URL" -tAc "$query"
  elif $DOCKER_COMPOSE ps -q db >/dev/null 2>&1; then
    $DOCKER_COMPOSE exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "$query"
  else
    echo "DATABASE_URL is not set and no docker compose db service is running." >&2
    exit 1
  fi
}

run_pg_dump() {
  if [[ -n "$DB_URL" ]]; then
    pg_dump "$DB_URL" "$@"
  elif $DOCKER_COMPOSE ps -q db >/dev/null 2>&1; then
    $DOCKER_COMPOSE exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" "$@"
  else
    echo "DATABASE_URL is not set and no docker compose db service is running." >&2
    exit 1
  fi
}

mkdir -p "$(dirname "$OUTPUT")"

if [[ -z "$TENANT_ID" ]]; then
  run_pg_dump --no-owner --no-privileges --format=plain > "$OUTPUT"
  echo "Full database backup written to $OUTPUT"
  exit 0
fi

tenant_exists=$(run_psql "SELECT 1 FROM tenants WHERE id = '$TENANT_ID' LIMIT 1;")
if [[ "$tenant_exists" != "1" ]]; then
  echo "Tenant $TENANT_ID does not exist." >&2
  exit 1
fi

{
  echo "-- SkillBridge tenant-scoped backup"
  echo "-- tenant_id: $TENANT_ID"
  echo "-- created_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo
} > "$OUTPUT"

tenant_tables=$(run_psql "SELECT table_name FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'tenant_id' ORDER BY table_name;")

run_pg_dump --data-only --column-inserts --no-owner --no-privileges \
  --table=tenants --where="id = '$TENANT_ID'" >> "$OUTPUT"

subscriptions_exists=$(run_psql "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions' LIMIT 1;")
if [[ "$subscriptions_exists" == "1" ]]; then
  plan_ids=$(run_psql "SELECT DISTINCT plan_id FROM subscriptions WHERE tenant_id = '$TENANT_ID' AND plan_id IS NOT NULL;")
  if [[ -n "$plan_ids" ]]; then
    plan_list=$(echo "$plan_ids" | awk '{printf "%s%s%s", sep, "'\''" $0 "'\''"; sep=","}')
    run_pg_dump --data-only --column-inserts --no-owner --no-privileges \
      --table=plans --where="id IN (${plan_list})" >> "$OUTPUT"
    run_pg_dump --data-only --column-inserts --no-owner --no-privileges \
      --table=plan_features --where="plan_id IN (${plan_list})" >> "$OUTPUT"
  fi
fi

memberships_exists=$(run_psql "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_memberships' LIMIT 1;")
if [[ "$memberships_exists" == "1" ]]; then
  user_ids=$(run_psql "SELECT DISTINCT user_id FROM tenant_memberships WHERE tenant_id = '$TENANT_ID' AND user_id IS NOT NULL;")
  if [[ -n "$user_ids" ]]; then
    user_list=$(echo "$user_ids" | awk '{printf "%s%s%s", sep, "'\''" $0 "'\''"; sep=","}')
    run_pg_dump --data-only --column-inserts --no-owner --no-privileges \
      --table=users --where="id IN (${user_list})" >> "$OUTPUT"
  fi
fi

while IFS= read -r table; do
  [[ -z "$table" ]] && continue
  run_pg_dump --data-only --column-inserts --no-owner --no-privileges \
    --table="$table" --where="tenant_id = '$TENANT_ID'" >> "$OUTPUT"
done <<< "$tenant_tables"

echo "Tenant-scoped backup written to $OUTPUT"
