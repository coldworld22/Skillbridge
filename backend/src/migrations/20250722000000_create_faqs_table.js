exports.up = function(knex) {
  return knex.schema.createTable('faqs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('question').notNullable();
    table.text('answer').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('faqs');
};
