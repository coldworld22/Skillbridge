exports.up = function(knex) {
  return knex.schema.createTable('class_enrollments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('class_id').notNullable().references('id').inTable('online_classes').onDelete('CASCADE');
    table.string('status').defaultTo('enrolled');
    table.timestamp('enrolled_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'class_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('class_enrollments');
};
