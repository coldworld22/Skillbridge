const TABLE_NAME = 'books';

exports.up = function (knex) {
  return knex.schema.createTable(TABLE_NAME, (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.decimal('price', 10, 2).notNullable().defaultTo(0);
    table.string('pdf_url');
    table.string('cover_image_url');
    table
      .integer('category_id')
      .unsigned()
      .references('id')
      .inTable('book_categories')
      .onDelete('SET NULL');
    table
      .integer('instructor_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .enu('status', ['pending', 'approved', 'rejected'])
      .notNullable()
      .defaultTo('pending');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists(TABLE_NAME);
};
