exports.up = async function (knex) {
  await knex.schema.alterTable('online_classes', (table) => {
    table.enu('access_type', ['paid', 'free']).notNullable().defaultTo('paid');
  });

  await knex('online_classes').update({ access_type: 'paid' });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('online_classes', (table) => {
    table.dropColumn('access_type');
  });
};
