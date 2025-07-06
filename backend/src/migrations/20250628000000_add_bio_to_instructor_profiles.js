exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn('instructor_profiles', 'bio');
  if (!exists) {
    await knex.schema.alterTable('instructor_profiles', (table) => {
      table.text('bio');
    });
  }
};

exports.down = async function(knex) {
  const exists = await knex.schema.hasColumn('instructor_profiles', 'bio');
  if (exists) {
    await knex.schema.alterTable('instructor_profiles', (table) => {
      table.dropColumn('bio');
    });
  }
};
