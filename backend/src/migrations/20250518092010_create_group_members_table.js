// 📁 migrations/YYYYMMDD_create_group_members_table.js

exports.up = function(knex) {
  return knex.schema.createTable('group_members', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('group_id').notNullable().references('id').inTable('groups').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enu('role', ['admin', 'member']).defaultTo('member');
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.unique(['group_id', 'user_id']); // prevent duplicates
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('group_members');
};
