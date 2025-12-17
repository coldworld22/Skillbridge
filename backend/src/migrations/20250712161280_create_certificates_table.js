exports.up = function(knex) {
  return knex.schema.createTable('certificates', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('tutorial_id').references('id').inTable('tutorials').onDelete('CASCADE');
    table.uuid('class_id').references('id').inTable('online_classes').onDelete('CASCADE');
    table.uuid('template_id').references('id').inTable('certificate_templates').onDelete('SET NULL');
    table.string('certificate_code').notNullable().unique();
    table.enu('status', ['issued', 'revoked']).defaultTo('issued');
    table.timestamp('revoked_at');
    table.string('reason');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('certificates');
};
