// 📁 migrations/YYYYMMDD_create_certificate_verifications_table.js

exports.up = function(knex) {
  return knex.schema.createTable('certificate_verifications', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('certificate_id').notNullable().references('id').inTable('certificates').onDelete('CASCADE');
    table.string('ip_address');
    table.string('user_agent');
    table.string('location'); // optional (country/city from IP)
    table.timestamp('verified_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('certificate_verifications');
};
