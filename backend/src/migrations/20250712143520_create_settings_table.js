exports.up = function(knex) {
  return knex.schema.createTable('settings', function(table) {
    table.string('key').primary();
    table.text('value');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('settings');
};
