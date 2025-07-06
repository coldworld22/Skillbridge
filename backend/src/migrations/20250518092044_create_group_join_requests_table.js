// 📁 migrations/YYYYMMDD_create_group_join_requests_table.js

exports.up = function(knex) {
  return knex.schema.createTable('group_join_requests', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('group_id').notNullable().references('id').inTable('groups').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enu('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    table.timestamp('requested_at').defaultTo(knex.fn.now());
    table.timestamp('responded_at');
    table.unique(['group_id', 'user_id']); // one active request per user per group
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('group_join_requests');
};
