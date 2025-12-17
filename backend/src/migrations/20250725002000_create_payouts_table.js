exports.up = function(knex) {
  return knex.schema.createTable('payouts', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('instructor_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency').notNullable().defaultTo('USD');
    table.string('status').notNullable().defaultTo('pending');
    table.text('notes');
    table.timestamp('requested_at').defaultTo(knex.fn.now());
    table.timestamp('processed_at');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payouts');
};
