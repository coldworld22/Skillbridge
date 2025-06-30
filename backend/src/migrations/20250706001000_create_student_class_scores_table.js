exports.up = function(knex) {
  return knex.schema.createTable('student_class_scores', function(table) {
    table.increments('id').primary();
    table.uuid('class_id').references('id').inTable('online_classes').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('assignment_score').defaultTo(0);
    table.integer('attendance_score').defaultTo(0);
    table.integer('final_exam_score').defaultTo(0);
    table.integer('total_score').defaultTo(0);
    table.boolean('passed').defaultTo(false);
    table.boolean('certificate_issued').defaultTo(false);
    table.timestamp('issued_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('student_class_scores');
};
