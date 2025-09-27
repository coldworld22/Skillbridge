exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('online_classes', 'access_type');
  if (!hasColumn) {
    await knex.schema.alterTable('online_classes', (table) => {
      table.string('access_type').notNullable().defaultTo('paid');
    });
  }

  await knex('online_classes').whereNull('access_type').update({ access_type: 'paid' });
};

exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('online_classes', 'access_type');
  if (hasColumn) {
    await knex.schema.alterTable('online_classes', (table) => {
      table.dropColumn('access_type');
    });
  }
};
