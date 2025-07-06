// \ud83d\udc81 migrations/YYYYMMDD_create_certificates_table.js

exports.up = function(knex) {
  return knex.schema.createTable('certificates', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('class_id').references('id').inTable('online_classes').onDelete('SET NULL');
    table.uuid('tutorial_id').references('id').inTable('tutorials').onDelete('SET NULL');
    table.uuid('template_id').references('id').inTable('certificate_templates').onDelete('SET NULL');
    table.string('certificate_code').notNullable().unique();
    table.enu('status', ['issued', 'revoked', 'pending']).defaultTo('issued');
    table.timestamp('issued_at').defaultTo(knex.fn.now());
    table.timestamp('revoked_at');
    table.text('reason'); // optional reason for revocation
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('certificates');
};
