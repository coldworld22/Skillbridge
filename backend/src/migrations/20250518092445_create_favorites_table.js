// 📁 migrations/YYYYMMDD_create_favorites_table.js

exports.up = function(knex) {
  return knex.schema.createTable('favorites', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('student_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('instructor_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['student_id', 'instructor_id']); // prevent duplicates
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('favorites');
};
