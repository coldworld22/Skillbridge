const TABLE_NAME = 'cart_items';

exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn(TABLE_NAME, 'price');
  if (!exists) {
    await knex.schema.alterTable(TABLE_NAME, (table) => {
      table.decimal('price', 10, 2).notNullable().defaultTo(0);
    });
  }
};

exports.down = async function(knex) {
  const exists = await knex.schema.hasColumn(TABLE_NAME, 'price');
  if (exists) {
    await knex.schema.alterTable(TABLE_NAME, (table) => {
      table.dropColumn('price');
    });
  }
};
