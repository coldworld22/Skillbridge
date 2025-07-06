// 📁 migrations/YYYYMMDD_create_groups_table.js

exports.up = function(knex) {
  return knex.schema.createTable('groups', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('creator_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description');
    table.enu('visibility', ['public', 'private']).defaultTo('public');
    table.boolean('requires_approval').defaultTo(false); // for join requests
    table.string('cover_image');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('groups');
};
