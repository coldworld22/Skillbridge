exports.up = function(knex) {
  return knex.schema.createTable('quiz_attempts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('quiz_id').notNullable().references('id').inTable('tutorial_quizzes').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('score').notNullable();
    table.boolean('passed').defaultTo(false);
    table.timestamp('attempted_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('quiz_attempts');
};
