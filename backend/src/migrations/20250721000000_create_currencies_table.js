exports.up = function(knex) {
  return knex.schema.createTable('currencies', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('label').notNullable();
    table.string('code').notNullable().unique();
    table.string('symbol').notNullable();
    table.decimal('exchange_rate', 14, 6).notNullable().defaultTo(1);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.boolean('is_default').notNullable().defaultTo(false);
    table.boolean('auto_update').notNullable().defaultTo(true);
    table.string('logo_url');
    table.timestamp('last_updated');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('currencies');
};
