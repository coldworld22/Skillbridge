/**
 * Ensures required database extensions exist.
 * - pgcrypto provides digest/crypt helpers used for token hashing.
 * - uuid-ossp is used by a few legacy tables that still call uuid_generate_v4().
 */

exports.up = async function up(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
};

exports.down = async function down(knex) {
  // Intentionally leave extensions in place; dropping them could break other objects.
  await knex.raw('SELECT 1');
};
