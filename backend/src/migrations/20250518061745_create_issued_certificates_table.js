// 📁 migrations/YYYYMMDD_create_issued_certificates_table.js

exports.up = function(knex) {
  return knex.schema.createTable('issued_certificates', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('certificate_code').notNullable().unique(); // same as in certificates
    table.string('user_name').notNullable();
    table.string('class_or_tutorial_title').notNullable();
    table.date('issue_date').notNullable();
    table.string('verified_url'); // link to verification page
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('issued_certificates');
};
