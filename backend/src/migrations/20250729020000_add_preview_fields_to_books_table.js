const TABLE_NAME = 'books';

exports.up = async function (knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.boolean('allow_preview').notNullable().defaultTo(false);
    table.jsonb('preview_pages');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn('allow_preview');
    table.dropColumn('preview_pages');
  });
};
