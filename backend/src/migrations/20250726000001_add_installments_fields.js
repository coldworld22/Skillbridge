exports.up = function(knex) {
  return knex.schema
    .alterTable('payments', function(table) {
      table.integer('installments').defaultTo(1);
      table.integer('installment_number').defaultTo(1);
      table.date('next_due_date');
    })
    .createTable('payment_schedules', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('payment_id').notNullable().references('id').inTable('payments').onDelete('CASCADE');
      table.integer('installment_number').notNullable();
      table.decimal('amount', 10, 2).notNullable();
      table.date('due_date').notNullable();
      table.string('status').notNullable().defaultTo('pending');
      table.timestamp('paid_at');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('payment_schedules')
    .then(() =>
      knex.schema.alterTable('payments', function(table) {
        table.dropColumn('installments');
        table.dropColumn('installment_number');
        table.dropColumn('next_due_date');
      })
    );
};
