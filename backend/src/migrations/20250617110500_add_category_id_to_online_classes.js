exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn('online_classes', 'category_id');
  if (!exists) {
    return knex.schema.alterTable('online_classes', function(table) {
      table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
    });
  }
};

exports.down = function(knex) {
  return knex.schema.alterTable('online_classes', function(table) {
    table.dropColumn('category_id');
  });
};
