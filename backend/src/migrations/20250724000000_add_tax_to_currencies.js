exports.up = function(knex) {
  return knex.schema.alterTable('currencies', table => {
    table.decimal('tax_rate', 5, 2).notNullable().defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('currencies', table => {
    table.dropColumn('tax_rate');
  });
};
