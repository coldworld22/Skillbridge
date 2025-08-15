const TABLE_NAME = 'books';

exports.up = async function (knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.text('cover_image_url').alter();
    table.text('pdf_url').alter();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string('cover_image_url').alter();
    table.string('pdf_url').alter();
  });
};
