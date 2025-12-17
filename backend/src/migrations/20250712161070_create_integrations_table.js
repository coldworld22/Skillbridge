exports.up = function(knex) {
  return knex.schema.createTable('integrations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('provider').notNullable();
    table.text('api_key');
    table.jsonb('config').defaultTo('{}');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('integrations');
};
