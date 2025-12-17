exports.up = function(knex) {
  return knex.schema.alterTable('payments', function(table) {
    table.jsonb('bank_details');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('payments', function(table) {
    table.dropColumn('bank_details');
  });
};
