// 📁 migrations/YYYYMMDD_create_assignment_submissions_table.js

exports.up = function(knex) {
  return knex.schema.createTable('assignment_submissions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('assignment_id').notNullable().references('id').inTable('class_assignments').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('submission_url'); // link to file or work
    table.float('grade'); // optional numeric grade
    table.timestamp('submitted_at').defaultTo(knex.fn.now());
    table.unique(['assignment_id', 'user_id']); // one submission per assignment per user
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('assignment_submissions');
};
