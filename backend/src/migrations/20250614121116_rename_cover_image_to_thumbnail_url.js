exports.up = function(knex) {
  return knex.schema.alterTable('tutorials', function(table) {
    table.renameColumn('cover_image', 'thumbnail_url');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('tutorials', function(table) {
    table.renameColumn('thumbnail_url', 'cover_image');
  });
};
