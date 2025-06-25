exports.up = function(knex) {
  return knex.schema.createTable('class_views', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('class_id').notNullable().references('id').inTable('online_classes').onDelete('CASCADE');
    table.uuid('viewer_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('ip_address');
    table.string('user_agent');
    table.timestamp('viewed_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('class_views');
};
