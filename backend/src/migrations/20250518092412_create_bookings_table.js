// 📁 migrations/YYYYMMDD_create_bookings_table.js

exports.up = function(knex) {
  return knex.schema.createTable('bookings', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('student_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('instructor_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time').notNullable();
    table.enu('status', ['pending', 'approved', 'declined', 'cancelled', 'completed']).defaultTo('pending');
    table.text('notes');
    table.timestamp('requested_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('bookings');
};
