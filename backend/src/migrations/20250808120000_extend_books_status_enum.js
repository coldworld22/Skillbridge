const TABLE_NAME = 'books';

exports.up = async function (knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table
      .enu('status', ['pending', 'approved', 'rejected', 'active', 'inactive'])
      .notNullable()
      .defaultTo('pending')
      .alter();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table
      .enu('status', ['pending', 'approved', 'rejected'])
      .notNullable()
      .defaultTo('pending')
      .alter();
  });
};
