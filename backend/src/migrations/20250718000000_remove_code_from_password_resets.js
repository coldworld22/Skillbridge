exports.up = function(knex) {
  return knex.schema.alterTable('password_resets', function(table) {
    table.dropColumn('code');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('password_resets', function(table) {
    table.string('code', 10).notNullable();
  });
};
