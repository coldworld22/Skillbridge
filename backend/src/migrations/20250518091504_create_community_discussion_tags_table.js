// 📁 migrations/YYYYMMDD_create_community_discussion_tags_table.js

exports.up = function(knex) {
  return knex.schema.createTable('community_discussion_tags', function(table) {
    table.uuid('discussion_id').notNullable().references('id').inTable('community_discussions').onDelete('CASCADE');
    table.integer('tag_id').notNullable().references('id').inTable('community_tags').onDelete('CASCADE');
    table.primary(['discussion_id', 'tag_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('community_discussion_tags');
};
