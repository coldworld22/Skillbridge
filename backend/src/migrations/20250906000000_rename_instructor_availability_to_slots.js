exports.up = async function(knex) {
  await knex.schema.alterTable('instructor_profiles', table => {
    table.jsonb('availability_slots').defaultTo('[]');
  });

  // Move existing JSON arrays from `availability` into `availability_slots`
  await knex('instructor_profiles').update({
    availability_slots: knex.raw("CASE WHEN availability IS NOT NULL AND availability != '' THEN COALESCE(availability::jsonb, '[]'::jsonb) ELSE '[]'::jsonb END")
  });

  await knex.schema.alterTable('instructor_profiles', table => {
    table.dropColumn('availability');
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('instructor_profiles', table => {
    table.text('availability');
  });

  await knex('instructor_profiles').update({
    availability: knex.raw("availability_slots::text")
  });

  await knex.schema.alterTable('instructor_profiles', table => {
    table.dropColumn('availability_slots');
  });
};
