exports.up = function(knex) {
  return knex.schema.createTable('tutorial_assignment_submissions', function(table) {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('assignment_id')
      .notNullable()
      .references('id')
      .inTable('tutorial_assignments')
      .onDelete('CASCADE');
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('file_url');
    table.integer('grade');
    table.text('text_answer');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tutorial_assignment_submissions');
};
