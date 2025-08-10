exports.up = function(knex) {
  return knex.schema.createTable('tutorial_assignments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tutorial_id').notNullable().references('id').inTable('tutorials').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description');
    table.date('due_date');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tutorial_assignments');
};
