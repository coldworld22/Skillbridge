exports.up = function(knex) {
  return knex.schema.createTable('class_scoring_policies', function(table) {
    table.increments('id').primary();
    table.uuid('class_id').references('id').inTable('online_classes').onDelete('CASCADE');
    table.integer('assignment_weight').defaultTo(60);
    table.integer('attendance_weight').defaultTo(40);
    table.integer('final_exam_weight').defaultTo(0);
    table.integer('pass_score').defaultTo(60);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('class_scoring_policies');
};
