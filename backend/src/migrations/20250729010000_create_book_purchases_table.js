const TABLE_NAME = 'book_purchases';

exports.up = function (knex) {
  return knex.schema.createTable(TABLE_NAME, (table) => {
    table.increments('id').primary();
    table
      .uuid('student_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('book_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('books')
      .onDelete('CASCADE');
    table.decimal('price_paid', 10, 2).notNullable().defaultTo(0);
    table.timestamp('purchased_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists(TABLE_NAME);
};
