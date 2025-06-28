exports.up = async function (knex) {
  await knex.schema.alterTable('tutorials', table => {
    table.timestamp('start_date');
    table.timestamp('end_date');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('tutorials', table => {
    table.dropColumn('start_date');
    table.dropColumn('end_date');
  });
};
