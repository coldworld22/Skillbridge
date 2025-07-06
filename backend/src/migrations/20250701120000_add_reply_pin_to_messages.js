exports.up = function(knex) {
  return knex.schema.table('messages', function(table) {
    table.uuid('reply_to_id').references('id').inTable('messages').onDelete('SET NULL');
    table.boolean('pinned').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.table('messages', function(table) {
    table.dropColumn('reply_to_id');
    table.dropColumn('pinned');
  });
};
