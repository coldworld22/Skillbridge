exports.up = function(knex) {
  return knex.schema.table('messages', function(table) {
    table.boolean('read').defaultTo(false);
    table.timestamp('read_at');
  });
};

exports.down = function(knex) {
  return knex.schema.table('messages', function(table) {
    table.dropColumn('read');
    table.dropColumn('read_at');
  });
};
