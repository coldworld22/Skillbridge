exports.up = function(knex) {
  return knex.schema.createTable('plans', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('slug').notNullable().unique();
    table.decimal('price_monthly', 10, 2).defaultTo(0);
    table.decimal('price_yearly', 10, 2).defaultTo(0);
    table.string('currency').defaultTo('USD');
    table.boolean('recommended').defaultTo(false);
    table.boolean('active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('plans');
};
