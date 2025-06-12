exports.up = function(knex) {
  return knex.schema.createTable('quiz_choices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('question_id').notNullable().references('id').inTable('quiz_questions').onDelete('CASCADE');
    table.text('choice_text').notNullable();
    table.boolean('is_correct').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('quiz_choices');
};
