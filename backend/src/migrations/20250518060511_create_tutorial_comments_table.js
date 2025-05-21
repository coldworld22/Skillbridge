// 📁 migrations/YYYYMMDD_create_tutorial_comments_table.js

exports.up = function(knex) {
  return knex.schema.createTable('tutorial_comments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tutorial_id').notNullable().references('id').inTable('tutorials').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('message').notNullable();
    table.uuid('parent_id').references('id').inTable('tutorial_comments').onDelete('CASCADE'); // for threaded replies
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tutorial_comments');
};
