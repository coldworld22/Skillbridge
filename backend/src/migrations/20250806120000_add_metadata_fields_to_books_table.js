const TABLE_NAME = 'books';

exports.up = async function (knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.renameColumn('description', 'detailed_description');
    table.text('short_description');
    table.string('language');
    table.string('license_type');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.renameColumn('detailed_description', 'description');
    table.dropColumn('short_description');
    table.dropColumn('language');
    table.dropColumn('license_type');
  });
};
