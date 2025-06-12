
exports.up = async function(knex) {
  // ✅ Simply alter category_id to UUID
  await knex.schema.alterTable('tutorials', (table) => {
    table.uuid('category_id').alter();
  });

  // ✅ Recreate FK if desired (optional)
  await knex.schema.alterTable('tutorials', (table) => {
    table
      .foreign('category_id')
      .references('id')
      .inTable('categories')
      .onDelete('SET NULL');
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('tutorials', (table) => {
    table.dropForeign('category_id');
    table.integer('category_id').alter();
  });

};
