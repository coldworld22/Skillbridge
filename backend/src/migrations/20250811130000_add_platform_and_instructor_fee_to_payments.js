exports.up = function(knex) {
  return knex.schema.alterTable('payments', function(table) {
    table.decimal('platform_fee', 10, 2).notNullable().defaultTo(0);
    table.decimal('instructor_amount', 10, 2).notNullable().defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('payments', function(table) {
    table.dropColumns('platform_fee', 'instructor_amount');
  });
};
