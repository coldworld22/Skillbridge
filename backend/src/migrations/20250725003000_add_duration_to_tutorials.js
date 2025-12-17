exports.up = async function(knex) {
  const hasDuration = await knex.schema.hasColumn('tutorials', 'duration');
  if (!hasDuration) {
    await knex.schema.alterTable('tutorials', table => {
      table.integer('duration');
    });
  }
};

exports.down = function(knex) {
  return knex.schema.alterTable('tutorials', table => {
    table.dropColumn('duration');
  });
};
