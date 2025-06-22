exports.up = async function(knex) {
  await knex.schema.alterTable('online_classes', table => {
    table.text('cover_image').alter();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('online_classes', table => {
    table.string('cover_image').alter();
  });
};
