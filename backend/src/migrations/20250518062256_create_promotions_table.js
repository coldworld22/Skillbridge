// 📁 migrations/YYYYMMDD_create_promotions_table.js

exports.up = function(knex) {
  return knex.schema.createTable('promotions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('code').notNullable().unique(); // e.g., SAVE20
    table.decimal('discount_percent', 5, 2).notNullable(); // 20.00 for 20%
    table.enu('type', ['class', 'tutorial', 'subscription']).notNullable();
    table.uuid('item_id'); // optional target (null = global)
    table.integer('max_uses');
    table.integer('uses_count').defaultTo(0);
    table.timestamp('start_date');
    table.timestamp('end_date');
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('promotions');
};
