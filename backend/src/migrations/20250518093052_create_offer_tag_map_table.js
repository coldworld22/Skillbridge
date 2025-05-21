// 📁 migrations/YYYYMMDD_create_offer_tag_map_table.js

exports.up = function(knex) {
  return knex.schema.createTable('offer_tag_map', function(table) {
    table.uuid('offer_id').notNullable().references('id').inTable('offers').onDelete('CASCADE');
    table.integer('tag_id').notNullable().references('id').inTable('offer_tags').onDelete('CASCADE');
    table.primary(['offer_id', 'tag_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('offer_tag_map');
};
