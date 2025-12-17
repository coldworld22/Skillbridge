exports.up = function(knex) {
  return knex.schema.createTable('book_tag_map', function(table) {
    table.integer('book_id').notNullable().references('id').inTable('books').onDelete('CASCADE');
    table.uuid('tag_id').notNullable().references('id').inTable('tags').onDelete('CASCADE');
    table.primary(['book_id', 'tag_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('book_tag_map');
};
