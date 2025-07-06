// 📁 migrations/YYYYMMDD_create_offer_responses_table.js

exports.up = function(knex) {
  return knex.schema.createTable('offer_responses', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('offer_id').notNullable().references('id').inTable('offers').onDelete('CASCADE');
    table.uuid('instructor_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('proposed_price', 10, 2);
    table.string('estimated_time'); // e.g., "3 days", "1 week"
    table.enu('status', ['pending', 'accepted', 'declined']).defaultTo('pending');
    table.text('notes');
    table.timestamp('responded_at').defaultTo(knex.fn.now());
    table.unique(['offer_id', 'instructor_id']); // one response per instructor per offer
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('offer_responses');
};
