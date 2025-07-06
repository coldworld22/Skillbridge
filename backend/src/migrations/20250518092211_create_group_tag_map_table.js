// 📁 migrations/YYYYMMDD_create_group_tag_map_table.js

exports.up = function(knex) {
  return knex.schema.createTable('group_tag_map', function(table) {
    table.uuid('group_id').notNullable().references('id').inTable('groups').onDelete('CASCADE');
    table.integer('tag_id').notNullable().references('id').inTable('group_tags').onDelete('CASCADE');
    table.primary(['group_id', 'tag_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('group_tag_map');
};
