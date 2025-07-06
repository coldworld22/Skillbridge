exports.up = async function(knex) {
  // Add new columns to `users` table
  await knex.schema.alterTable('users', (table) => {
    table.date('date_of_birth');
    table.string('gender', 50);
  });

  // Create student_profiles table
  await knex.schema.createTable('student_profiles', (table) => {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.specificType('topics', 'TEXT[]');
    table.string('education_level', 255);
    table.text('learning_goals');
  });

  // Create instructor_profiles table
  await knex.schema.createTable('instructor_profiles', (table) => {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.specificType('expertise', 'TEXT[]');
    table.text('experience');
    table.text('certifications');
    table.text('availability');
    table.text('pricing');
  });

  // Create user_social_links table
  await knex.schema.createTable('user_social_links', (table) => {
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('platform', 50);
    table.text('url');
    table.primary(['user_id', 'platform']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('user_social_links');
  await knex.schema.dropTableIfExists('instructor_profiles');
  await knex.schema.dropTableIfExists('student_profiles');

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('date_of_birth');
    table.dropColumn('gender');
  });
};
