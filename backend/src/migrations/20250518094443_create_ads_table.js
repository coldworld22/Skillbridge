// 📁 migrations/YYYYMMDD_create_ads_table.js

exports.up = function(knex) {
  return knex.schema.createTable('ads', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description');
    table.string('image_url');
    table.string('target_url');
    table.enu('placement', ['homepage', 'sidebar', 'dashboard', 'footer']).defaultTo('homepage');
    table.boolean('active').defaultTo(true);
    table.date('start_date');
    table.date('end_date');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('ads');
};
