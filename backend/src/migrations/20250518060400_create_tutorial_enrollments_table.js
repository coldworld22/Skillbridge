// 📁 migrations/YYYYMMDD_create_tutorial_enrollments_table.js

exports.up = function(knex) {
  return knex.schema.createTable('tutorial_enrollments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('tutorial_id').notNullable().references('id').inTable('tutorials').onDelete('CASCADE');
    table.enu('status', ['enrolled', 'completed']).defaultTo('enrolled');
    table.timestamp('enrolled_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'tutorial_id']); // prevent double enrollment
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tutorial_enrollments');
};
