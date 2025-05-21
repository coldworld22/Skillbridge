// 📁 migrations/YYYYMMDD_create_social_links_table.js

exports.up = function(knex) {
  return knex.schema.createTable('social_links', function(table) {
    table.increments('id').primary();
    table.string('platform').notNullable();     // e.g., "Facebook"
    table.string('icon').notNullable();         // e.g., "facebook", "twitter" (icon name or URL)
    table.string('url').notNullable();
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('social_links');
};
