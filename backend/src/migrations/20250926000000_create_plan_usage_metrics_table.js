exports.up = function(knex) {
  return knex.schema.createTable('plan_usage_metrics', function(table) {
    table.uuid('plan_id').notNullable().references('id').inTable('plans').onDelete('CASCADE');
    table.string('item_type').notNullable();
    table.uuid('item_id').notNullable();
    table.integer('usage_count').notNullable().defaultTo(0);
    table.decimal('instructor_amount', 10, 2).notNullable().defaultTo(0);
    table.primary(['plan_id', 'item_type', 'item_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('plan_usage_metrics');
};
