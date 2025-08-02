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
      .uuid('category_id')
      .references('id')
      .inTable('book_categories')
      .onDelete('SET NULL');
    table
      .uuid('instructor_id')
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
