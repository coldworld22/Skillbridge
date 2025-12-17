const TABLE_NAME = 'carts';

exports.up = function(knex) {
  return knex.schema.createTable(TABLE_NAME, (table) => {
    table.string('user_id').primary();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists(TABLE_NAME);
};

