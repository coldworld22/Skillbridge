// 📁 migrations/YYYYMMDD_create_community_replies_table.js

exports.up = function(knex) {
  return knex.schema.createTable('community_replies', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('discussion_id').notNullable().references('id').inTable('community_discussions').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable();
    table.boolean('is_solution').defaultTo(false); // marked as accepted answer
    table.integer('votes').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('community_replies');
};
