exports.up = function(knex) {
  return knex.schema.createTable('roles', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable().unique(); // e.g. Admin, Student, Instructor
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('roles');
};
