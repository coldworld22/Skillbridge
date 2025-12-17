exports.up = function(knex) {
  return knex.schema.alterTable('offers', function(table) {
    table.uuid('group_id').references('id').inTable('groups').onDelete('CASCADE');
    table.decimal('fee', 10, 2).defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('offers', function(table) {
    table.dropColumn('group_id');
    table.dropColumn('fee');
  });
};
