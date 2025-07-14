exports.up = function(knex) {
  return knex.schema.createTable('admin_profiles', function(table) {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.string('job_title');
    table.string('department');
    table.string('identity_doc_url');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('admin_profiles');
};
