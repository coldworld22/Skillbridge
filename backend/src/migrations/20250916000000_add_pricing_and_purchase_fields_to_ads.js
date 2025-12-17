exports.up = function(knex) {
  return knex.schema.alterTable('ads', function(table) {
    table.decimal('price', 10, 2).defaultTo(0);
    table.uuid('purchased_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('purchased_at');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('ads', function(table) {
    table.dropColumn('price');
    table.dropColumn('purchased_by');
    table.dropColumn('purchased_at');
  });
};
