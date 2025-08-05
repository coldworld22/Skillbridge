const TABLE_NAME = 'books';

exports.up = async function (knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn('category_id');
  });
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table
      .uuid('category_id')
      .references('id')
      .inTable('categories')
      .onDelete('SET NULL');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn('category_id');
  });
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table
      .uuid('category_id')
      .references('id')
      .inTable('book_categories')
      .onDelete('SET NULL');
  });
};
