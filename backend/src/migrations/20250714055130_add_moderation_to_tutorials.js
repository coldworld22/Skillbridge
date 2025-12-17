exports.up = async function(knex) {
  const hasStatus = await knex.schema.hasColumn('tutorials', 'moderation_status');
  const hasReason = await knex.schema.hasColumn('tutorials', 'rejection_reason');
  if (!hasStatus || !hasReason) {
    await knex.schema.alterTable('tutorials', table => {
      if (!hasStatus) table.enu('moderation_status', ['Pending', 'Approved', 'Rejected']).defaultTo('Pending');
      if (!hasReason) table.text('rejection_reason');
    });
    await knex.raw("ALTER TABLE tutorials DROP CONSTRAINT IF EXISTS tutorials_moderation_status_check");
    await knex.raw("ALTER TABLE tutorials ADD CONSTRAINT tutorials_moderation_status_check CHECK (moderation_status IS NULL OR moderation_status IN ('Pending','Approved','Rejected'))");
  }
};

exports.down = function(knex) {
  return knex.schema.alterTable('tutorials', table => {
    table.dropColumn('moderation_status');
    table.dropColumn('rejection_reason');
  });
};
