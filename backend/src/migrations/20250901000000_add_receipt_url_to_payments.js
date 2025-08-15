exports.up = function(knex) {
  return knex.schema.alterTable('payments', function(table) {
    table.string('receipt_url');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('payments', function(table) {
    table.dropColumn('receipt_url');
  });
};
