exports.up = function(knex) {
  return knex.schema.table('offer_messages', function(table) {
    table.uuid('reply_to_id').references('id').inTable('offer_messages').onDelete('SET NULL');
  });
};

exports.down = function(knex) {
  return knex.schema.table('offer_messages', function(table) {
    table.dropColumn('reply_to_id');
  });
};
