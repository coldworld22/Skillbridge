// 📁 migrations/YYYYMMDD_create_community_discussions_table.js

exports.up = function(knex) {
  return knex.schema.createTable('community_discussions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('content').notNullable();
    table.boolean('resolved').defaultTo(false);
    table.integer('views').defaultTo(0);
    table.integer('votes').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('community_discussions');
};
