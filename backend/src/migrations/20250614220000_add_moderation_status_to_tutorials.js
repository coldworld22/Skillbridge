exports.up = async function(knex) {
  await knex.schema.alterTable('tutorials', function(table) {
    table.enu('moderation_status', ['pending', 'approved', 'rejected']).nullable();
    table.text('rejection_reason');
  });
  // Knex's `enu` helper automatically creates a CHECK constraint that doesn't
  // allow NULL values. We need to drop that default constraint and replace it
  // with one that permits `NULL` so drafts can be saved without a moderation
  // status. Running the DROP and ADD as separate statements avoids issues with
  // drivers that reject multi‑statement queries.
  await knex.raw(
    `ALTER TABLE tutorials DROP CONSTRAINT IF EXISTS tutorials_moderation_status_check`
  );
  await knex.raw(
    `ALTER TABLE tutorials ADD CONSTRAINT tutorials_moderation_status_check CHECK (moderation_status IS NULL OR moderation_status IN ('pending','approved','rejected'))`
  );
};

exports.down = async function(knex) {
  await knex.schema.alterTable('tutorials', function(table) {
    table.dropColumn('rejection_reason');
    table.dropColumn('moderation_status');
  });
};
