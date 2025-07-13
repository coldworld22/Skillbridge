exports.up = function(knex) {
  return knex.schema.createTable('student_class_scores', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('class_id').notNullable().references('id').inTable('online_classes').onDelete('CASCADE');
    table.uuid('student_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('assignment_score');
    table.integer('attendance_score');
    table.integer('final_exam_score');
    table.integer('total_score');
    table.boolean('passed').defaultTo(false);
    table.boolean('certificate_issued').defaultTo(false);
    table.timestamp('issued_at');
    table.timestamps(true, true);
    table.unique(['class_id', 'student_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('student_class_scores');
};
