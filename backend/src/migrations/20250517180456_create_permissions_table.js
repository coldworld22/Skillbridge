exports.up = function(knex) {
  return knex.schema.createTable('permissions', function(table) {
    table.increments('id').primary();
    table.string('code').notNullable().unique(); // e.g. "manage_users"
    table.string('label');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('permissions');
};
