exports.up = function(knex) {
  return knex.schema.createTable('student_profiles', function(table) {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.string('education_level');
    table.text('topics');
    table.text('learning_goals');
    table.string('identity_doc_url');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('student_profiles');
};
