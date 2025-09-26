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

restore_verification_migration_to_string() {
  cat <<'EOF'
/**
 * Expand the verifications.code column so hashed OTPs fit without truncation.
 *
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  const hasTable = await knex.schema.hasTable('verifications');
  if (!hasTable) {
    return;
  }

  const columnInfo = await knex('verifications').columnInfo();
  const codeInfo = columnInfo && columnInfo.code;

  if (!codeInfo) {
    return;
  }

  if (codeInfo.type === 'text') {
    return;
  }

  if (codeInfo.maxLength && Number(codeInfo.maxLength) >= 255) {
    return;
  }

  await knex.schema.alterTable('verifications', (table) => {
    table.string('code', 255).notNullable().alter();
  });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  const hasTable = await knex.schema.hasTable('verifications');
  if (!hasTable) {
    return;
  }

  const columnInfo = await knex('verifications').columnInfo();
  const codeInfo = columnInfo && columnInfo.code;

  if (!codeInfo || codeInfo.type === 'text') {
    return;
  }

  if (codeInfo.maxLength && Number(codeInfo.maxLength) <= 10) {
    return;
  }

  const hasLongCodes = await knex('verifications')
    .whereRaw('char_length(code) > 10')
    .first();

  if (hasLongCodes) {
    throw new Error(
      'Cannot shrink verifications.code to length 10 because data longer than 10 characters exists.'
    );
  }
  await knex.schema.alterTable('verifications', (table) => {
    table.string('code', 10).notNullable().alter();
  });
};
EOF
}

restore_verification_migration_to_text() {
  cat <<'EOF'
/**
 * Migrate verifications.code to TEXT to permanently remove length constraints.
 *
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  const hasTable = await knex.schema.hasTable('verifications');
  if (!hasTable) {
    return;
  }

  const columnInfo = await knex('verifications').columnInfo();
  const codeInfo = columnInfo && columnInfo.code;

  if (!codeInfo) {
    return;
  }

  if (codeInfo.type === 'text') {
    return;
  }

  await knex.schema.alterTable('verifications', (table) => {
    table.text('code').notNullable().alter();
  });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  const hasTable = await knex.schema.hasTable('verifications');
  if (!hasTable) {
    return;
  }

  const columnInfo = await knex('verifications').columnInfo();
  const codeInfo = columnInfo && columnInfo.code;

  if (!codeInfo || codeInfo.type !== 'text') {
    return;
  }

  const hasLongCodes = await knex('verifications')
    .whereRaw('char_length(code) > 255')
    .first();

  if (hasLongCodes) {
    throw new Error(
      'Cannot shrink verifications.code to length 255 because data longer than 255 characters exists.'
    );
  }
  await knex.schema.alterTable('verifications', (table) => {
    table.string('code', 255).notNullable().alter();
  });
};
EOF
}

restore_required_migrations() {
  local_base="src/migrations"
  mkdir -p "$local_base"

  for migration in \
    20250926123707_alter_verifications_code_to_text.js \
    20250926124314_alter_verifications_code_to_text.js; do
    if [ -f "$local_base/$migration" ]; then
      continue
    fi

    echo "WARNING: Missing $local_base/$migration inside the container. Restoring from embedded copy." >&2

    case "$migration" in
      20250926123707_alter_verifications_code_to_text.js)
        restore_verification_migration_to_string > "$local_base/$migration"
        ;;
      20250926124314_alter_verifications_code_to_text.js)
        restore_verification_migration_to_text > "$local_base/$migration"
        ;;
    esac
  done
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
      restore_required_migrations
      run_as_node npx knex migrate:latest
    else
      echo "Skipping automatic database migrations because RUN_DB_MIGRATIONS=${RUN_DB_MIGRATIONS}."
    fi

    prepare_upload_dirs
  fi

  run_as_node "$@"

}

main "$@"
