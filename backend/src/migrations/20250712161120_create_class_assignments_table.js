exports.up = function(knex) {
  return knex.schema.createTable('class_assignments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('class_id').notNullable().references('id').inTable('online_classes').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description');
    table.date('due_date');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('class_assignments');
};
