exports.up = function(knex) {
  return knex.schema.createTable('instructor_wallets', function(table) {
    table.uuid('instructor_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('balance', 10, 2).notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('instructor_wallets');
};
