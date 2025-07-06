// 📁 migrations/YYYYMMDD_create_booking_reviews_table.js

exports.up = function(knex) {
  return knex.schema.createTable('booking_reviews', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('booking_id').notNullable().references('id').inTable('bookings').onDelete('CASCADE');
    table.uuid('student_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('instructor_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('rating').notNullable().checkBetween([1, 5]);
    table.text('comment');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['booking_id', 'student_id']); // one review per booking
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('booking_reviews');
};
