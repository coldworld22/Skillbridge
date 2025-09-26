exports.up = function (knex) {
  return knex.schema.createTable('faqs', (table) => {
    table.increments('id').primary();
    table.string('question', 500).notNullable();
    table.text('answer').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('faqs');
};
