// 📁 migrations/YYYYMMDD_create_ad_analytics_table.js

exports.up = function(knex) {
  return knex.schema.createTable('ad_analytics', function(table) {
    table.uuid('ad_id').primary().references('id').inTable('ads').onDelete('CASCADE');
    table.integer('views').defaultTo(0);
    table.integer('clicks').defaultTo(0);
    table.decimal('ctr', 5, 2).defaultTo(0); // click-through rate %
    table.integer('unique_viewers').defaultTo(0);
    table.timestamp('last_updated').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('ad_analytics');
};
