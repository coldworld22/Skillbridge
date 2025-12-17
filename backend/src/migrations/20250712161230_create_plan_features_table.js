exports.up = function(knex) {
  return knex.schema.createTable('plan_features', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('plan_id').notNullable().references('id').inTable('plans').onDelete('CASCADE');
    table.string('feature_key').notNullable();
    table.string('value');
    table.string('description');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('plan_features');
};
