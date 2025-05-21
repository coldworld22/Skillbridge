// 📁 migrations/YYYYMMDD_create_community_announcements_table.js

exports.up = function(knex) {
  return knex.schema.createTable('community_announcements', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('author_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.enu('audience', ['all', 'students', 'instructors']).defaultTo('all');
    table.boolean('pinned').defaultTo(false);
    table.timestamp('start_date').defaultTo(knex.fn.now());
    table.timestamp('end_date');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('community_announcements');
};
