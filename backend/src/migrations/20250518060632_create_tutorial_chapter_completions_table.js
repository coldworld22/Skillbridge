// 📁 migrations/YYYYMMDD_create_tutorial_chapter_completions_table.js

exports.up = function(knex) {
  return knex.schema.createTable('tutorial_chapter_completions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('chapter_id').notNullable().references('id').inTable('tutorial_chapters').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('completed_at').defaultTo(knex.fn.now());
    table.unique(['chapter_id', 'user_id']); // one record per user per chapter
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tutorial_chapter_completions');
};
