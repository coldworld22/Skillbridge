exports.up = function(knex) {
  return knex.schema.createTable('class_enrollments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('class_id').notNullable().references('id').inTable('online_classes').onDelete('CASCADE');
    table.enu('status', ['enrolled', 'completed', 'cancelled']).defaultTo('enrolled');
    table.timestamp('enrolled_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'class_id']); // prevent duplicate enrollments
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('class_enrollments');
};
