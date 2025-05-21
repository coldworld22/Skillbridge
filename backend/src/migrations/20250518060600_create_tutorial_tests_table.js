// 📁 migrations/YYYYMMDD_create_tutorial_tests_table.js

exports.up = function(knex) {
  return knex.schema.createTable('tutorial_tests', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tutorial_id').notNullable().references('id').inTable('tutorials').onDelete('CASCADE');
    table.string('title').notNullable();
    table.jsonb('questions').notNullable(); // stored as JSON (Q&A, MCQ, etc.)
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tutorial_tests');
};
