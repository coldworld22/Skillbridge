// 📁 migrations/YYYYMMDD_create_tutorial_tag_map_table.js

exports.up = function(knex) {
  return knex.schema.createTable('tutorial_tag_map', function(table) {
    table.uuid('tutorial_id').notNullable().references('id').inTable('tutorials').onDelete('CASCADE');
    table.integer('tag_id').notNullable().references('id').inTable('tutorial_tags').onDelete('CASCADE');
    table.primary(['tutorial_id', 'tag_id']); // composite PK to avoid duplicates
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tutorial_tag_map');
};
