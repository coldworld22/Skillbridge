exports.up = function(knex) {
  return knex.schema.createTable('class_tag_map', function(table) {
    table.uuid('class_id').notNullable().references('id').inTable('online_classes').onDelete('CASCADE');
    table.uuid('tag_id').notNullable().references('id').inTable('class_tags').onDelete('CASCADE');
    table.primary(['class_id', 'tag_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('class_tag_map');
};
