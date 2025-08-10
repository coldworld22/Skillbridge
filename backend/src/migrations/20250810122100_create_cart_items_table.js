const TABLE_NAME = 'cart_items';

exports.up = function(knex) {
  return knex.schema.createTable(TABLE_NAME, (table) => {
    table.increments('id').primary();
    table.string('user_id').notNullable().references('user_id').inTable('carts').onDelete('CASCADE');
    table.string('item_id').notNullable();
    table.string('name');
    table.string('item_type').notNullable().defaultTo('class');
    table.decimal('price', 10, 2).notNullable().defaultTo(0);
    table.integer('quantity').notNullable().defaultTo(1);
    table.timestamp('added_at').defaultTo(knex.fn.now());
    table.boolean('reminder_sent').defaultTo(false);
    table.unique(['user_id', 'item_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists(TABLE_NAME);
};

