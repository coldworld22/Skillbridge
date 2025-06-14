exports.up = async function(knex) {
  await knex.schema.alterTable('tutorials', function(table) {
    table.enu('moderation_status', ['pending', 'approved', 'rejected']).nullable();
    table.text('rejection_reason');
  });
  await knex.raw(`
    ALTER TABLE tutorials
    DROP CONSTRAINT IF EXISTS tutorials_moderation_status_check;
    ALTER TABLE tutorials
    ADD CONSTRAINT tutorials_moderation_status_check
    CHECK (moderation_status IS NULL OR moderation_status IN ('pending','approved','rejected'));
  `);
};

exports.down = async function(knex) {
  await knex.schema.alterTable('tutorials', function(table) {
    table.dropColumn('rejection_reason');
    table.dropColumn('moderation_status');
  });
};
