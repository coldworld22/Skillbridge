exports.up = function(knex) {
  return knex.schema.table('groups', function(table) {
    table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
    table.integer('max_size');
    table.string('timezone');
  });
};

exports.down = function(knex) {
  return knex.schema.table('groups', function(table) {
    table.dropColumn('category_id');
    table.dropColumn('max_size');
    table.dropColumn('timezone');
  });
};
