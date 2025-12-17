exports.up = function(knex) {
  return knex.schema.createTable('payments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.uuid('method_id').notNullable().references('id').inTable('payment_methods_config');
    table.string('item_type').notNullable();
    table.uuid('item_id').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency').notNullable().defaultTo('USD');
    table.string('status').notNullable().defaultTo('pending_payment');
    table.string('reference_id');
    table.timestamp('paid_at');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payments');
};
