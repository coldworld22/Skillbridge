/**
 * Ensures the blacklisted_tokens table stores the raw token value used by the
 * authentication middleware. Older database snapshots were missing the
 * `token` column, which caused queries like `where { token }` to crash with
 * `column "token" does not exist` when verifying access tokens. This
 * migration adds the column and a uniqueness constraint (partial to allow
 * existing NULL values) so the blacklist queries work reliably.
 */

exports.up = async function up(knex) {
  const hasTokenColumn = await knex.schema.hasColumn('blacklisted_tokens', 'token');
  if (!hasTokenColumn) {
    await knex.schema.alterTable('blacklisted_tokens', (table) => {
      table.string('token');
    });
    await knex.raw(
      'CREATE UNIQUE INDEX IF NOT EXISTS blacklisted_tokens_token_unique ON blacklisted_tokens (token) WHERE token IS NOT NULL'
    );
  }
};

exports.down = async function down(knex) {
  const hasTokenColumn = await knex.schema.hasColumn('blacklisted_tokens', 'token');
  if (hasTokenColumn) {
    await knex.raw(
      'DROP INDEX IF EXISTS blacklisted_tokens_token_unique'
    );
    await knex.schema.alterTable('blacklisted_tokens', (table) => {
      table.dropColumn('token');
    });
  }
};
