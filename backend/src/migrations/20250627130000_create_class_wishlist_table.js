exports.up = function(knex) {
  return knex.schema.createTable('class_wishlist', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('class_id').notNullable().references('id').inTable('online_classes').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'class_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('class_wishlist');
};
