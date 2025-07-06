// 📁 migrations/YYYYMMDD_create_offers_table.js

exports.up = function(knex) {
  return knex.schema.createTable('offers', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('student_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description');
    table.string('budget');
    table.string('timeframe');
    table.enu('status', ['open', 'closed', 'cancelled']).defaultTo('open');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('offers');
};
