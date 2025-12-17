const TABLE_NAME = 'cart_items';

exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn(TABLE_NAME, 'item_type');
  if (!exists) {
    await knex.schema.alterTable(TABLE_NAME, (table) => {
      table.string('item_type').notNullable().defaultTo('class');
    });
  }
};

exports.down = async function(knex) {
  const exists = await knex.schema.hasColumn(TABLE_NAME, 'item_type');
  if (exists) {
    await knex.schema.alterTable(TABLE_NAME, (table) => {
      table.dropColumn('item_type');
    });
  }
};

