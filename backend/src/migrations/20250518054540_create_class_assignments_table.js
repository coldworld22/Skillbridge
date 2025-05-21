// 📁 migrations/YYYYMMDD_create_class_assignments_table.js

exports.up = function(knex) {
  return knex.schema.createTable('class_assignments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('class_id').notNullable().references('id').inTable('online_classes').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description');
    table.timestamp('due_date');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('class_assignments');
};
