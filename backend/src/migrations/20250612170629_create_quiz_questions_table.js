exports.up = function(knex) {
  return knex.schema.createTable('quiz_questions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('quiz_id').notNullable().references('id').inTable('tutorial_quizzes').onDelete('CASCADE');
    table.text('question').notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('quiz_questions');
};
