// 📁 migrations/YYYYMMDD_create_ad_views_table.js

exports.up = function(knex) {
  return knex.schema.createTable('ad_views', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('ad_id').notNullable().references('id').inTable('ads').onDelete('CASCADE');
    table.uuid('viewer_id').references('id').inTable('users').onDelete('SET NULL'); // optional for guests
    table.string('ip_address');    // for anonymous viewers
    table.string('user_agent');    // optional device/browser tracking
    table.timestamp('viewed_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('ad_views');
};
