// 📁 migrations/YYYYMMDD_create_class_reviews_table.js

exports.up = function(knex) {
  return knex.schema.createTable('class_reviews', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('class_id').notNullable().references('id').inTable('online_classes').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('rating').notNullable().checkBetween([1, 5]);
    table.text('comment');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['class_id', 'user_id']); // prevent duplicate reviews
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('class_reviews');
};
