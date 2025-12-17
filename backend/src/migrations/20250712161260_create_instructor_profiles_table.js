exports.up = function(knex) {
  return knex.schema.createTable('instructor_profiles', function(table) {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.text('expertise');
    table.integer('experience');
    table.text('bio');
    table.text('certifications');
    table.text('availability');
    table.string('pricing');
    table.string('demo_video_url');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('instructor_profiles');
};
