exports.up = function(knex) {
  return knex.schema.createTable('tutorial_quizzes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tutorial_id').notNullable().references('id').inTable('tutorials').onDelete('CASCADE');
    table.integer('pass_score').defaultTo(70);
    table.integer('max_attempts').defaultTo(3);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tutorial_quizzes');
};
