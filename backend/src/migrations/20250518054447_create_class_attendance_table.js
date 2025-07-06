// 📁 migrations/YYYYMMDD_create_class_attendance_table.js

exports.up = function(knex) {
  return knex.schema.createTable('class_attendance', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('lesson_id').notNullable().references('id').inTable('class_lessons').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.boolean('attended').defaultTo(false);
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.unique(['lesson_id', 'user_id']); // one attendance per lesson per student
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('class_attendance');
};
