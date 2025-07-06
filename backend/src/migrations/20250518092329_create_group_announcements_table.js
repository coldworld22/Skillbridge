// 📁 migrations/YYYYMMDD_create_group_announcements_table.js

exports.up = function(knex) {
  return knex.schema.createTable('group_announcements', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('group_id').notNullable().references('id').inTable('groups').onDelete('CASCADE');
    table.uuid('author_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.boolean('pinned').defaultTo(false);
    table.timestamp('start_date').defaultTo(knex.fn.now());
    table.timestamp('end_date');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('group_announcements');
};
