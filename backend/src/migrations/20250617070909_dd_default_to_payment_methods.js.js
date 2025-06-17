exports.up = async function(knex) {
  const hasCol = await knex.schema.hasColumn('payment_methods_config', 'is_default');
  if (!hasCol) {
    await knex.schema.alterTable('payment_methods_config', function(table) {
      table.boolean('is_default').defaultTo(false);
    });
  }
  await knex.raw(`CREATE UNIQUE INDEX IF NOT EXISTS payment_methods_default_idx ON payment_methods_config (is_default) WHERE is_default = true`);
};

exports.down = async function(knex) {
  await knex.raw('DROP INDEX IF EXISTS payment_methods_default_idx');
  return knex.schema.alterTable('payment_methods_config', function(table) {
    table.dropColumn('is_default');
  });
};
