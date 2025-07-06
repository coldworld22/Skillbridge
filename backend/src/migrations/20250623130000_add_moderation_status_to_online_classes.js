exports.up = async function(knex) {
  const hasStatus = await knex.schema.hasColumn('online_classes', 'moderation_status');
  const hasReason = await knex.schema.hasColumn('online_classes', 'rejection_reason');
  await knex.schema.alterTable('online_classes', function(table) {
    if (!hasStatus) {
      table.enu('moderation_status', ['Pending', 'Approved', 'Rejected']).defaultTo('Pending');
    }
    if (!hasReason) {
      table.text('rejection_reason');
    }
  });
  await knex.raw('ALTER TABLE online_classes DROP CONSTRAINT IF EXISTS online_classes_moderation_status_check');
  await knex.raw("ALTER TABLE online_classes ADD CONSTRAINT online_classes_moderation_status_check CHECK (moderation_status IS NULL OR moderation_status IN ('Pending','Approved','Rejected'))");
};

exports.down = function(knex) {
  return knex.schema.alterTable('online_classes', function(table) {
    table.dropColumn('moderation_status');
    table.dropColumn('rejection_reason');
  });
};
