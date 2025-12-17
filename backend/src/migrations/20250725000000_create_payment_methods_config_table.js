exports.up = function(knex) {
  return knex.schema.createTable('payment_methods_config', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('type').notNullable();
    table.string('icon');
    table.boolean('active').notNullable().defaultTo(true);
    table.jsonb('settings').defaultTo('{}');
    table.boolean('is_default').notNullable().defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payment_methods_config');
};
