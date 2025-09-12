/**
 * Adds expires_at column to blacklisted_tokens if missing.
 * @param { import('knex').Knex } knex
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('blacklisted_tokens');
  if (!hasTable) return;
  const hasColumn = await knex.schema.hasColumn('blacklisted_tokens', 'expires_at');
  if (!hasColumn) {
    await knex.schema.alterTable('blacklisted_tokens', (table) => {
      table.timestamp('expires_at').notNullable().index();
    });
  }
};

/**
 * Drops expires_at column from blacklisted_tokens if present.
 * @param { import('knex').Knex } knex
 */
exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('blacklisted_tokens');
  if (!hasTable) return;
  const hasColumn = await knex.schema.hasColumn('blacklisted_tokens', 'expires_at');
  if (hasColumn) {
    await knex.schema.alterTable('blacklisted_tokens', (table) => {
      table.dropColumn('expires_at');
    });
  }
};
