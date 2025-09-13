/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('blacklisted_tokens');
  if (!hasTable) return;
  const hasColumn = await knex.schema.hasColumn('blacklisted_tokens', 'token');
  if (hasColumn) {
    await knex.schema.alterTable('blacklisted_tokens', (table) => {
      table.dropUnique('token');
      table.renameColumn('token', 'token_hash');
    });
    await knex.schema.alterTable('blacklisted_tokens', (table) => {
      table.string('token_hash', 64).notNullable().unique().alter();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('blacklisted_tokens');
  if (!hasTable) return;
  const hasColumn = await knex.schema.hasColumn('blacklisted_tokens', 'token_hash');
  if (hasColumn) {
    await knex.schema.alterTable('blacklisted_tokens', (table) => {
      table.dropUnique('token_hash', 'blacklisted_tokens_token_hash_unique');
      table.renameColumn('token_hash', 'token');
    });
    await knex.schema.alterTable('blacklisted_tokens', (table) => {
      table.string('token').notNullable().unique().alter();
    });
  }
};
