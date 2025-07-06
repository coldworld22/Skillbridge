// 📁 migrations/YYYYMMDD_create_tutorial_reviews_table.js

exports.up = function(knex) {
  return knex.schema.createTable('tutorial_reviews', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tutorial_id').notNullable().references('id').inTable('tutorials').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('rating').notNullable().checkBetween([1, 5]);
    table.text('comment');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['tutorial_id', 'user_id']); // one review per user per tutorial
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tutorial_reviews');
};
