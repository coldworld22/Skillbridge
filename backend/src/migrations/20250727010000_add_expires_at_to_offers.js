exports.up = function(knex) {
  return knex.schema.alterTable('offers', function(table) {
    table.timestamp('expires_at').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('offers', function(table) {
    table.dropColumn('expires_at');
  });
};
