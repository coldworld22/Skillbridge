// 📁 migrations/YYYYMMDD_create_community_reports_table.js

exports.up = function(knex) {
  return knex.schema.createTable('community_reports', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('reporter_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('discussion_id').references('id').inTable('community_discussions').onDelete('CASCADE');
    table.uuid('reply_id').references('id').inTable('community_replies').onDelete('CASCADE');
    table.text('reason').notNullable();
    table.enu('status', ['pending', 'reviewed', 'dismissed']).defaultTo('pending');
    table.timestamp('reported_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('community_reports');
};
