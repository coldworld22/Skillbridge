// 📁 migrations/YYYYMMDD_create_plan_features_table.js

exports.up = function(knex) {
  return knex.schema.createTable('plan_features', function(table) {
    table.increments('id').primary();
    table.integer('plan_id').notNullable().references('id').inTable('plans').onDelete('CASCADE');
    table.string('feature_key').notNullable();     // e.g., "max_classes", "can_create_groups"
    table.string('value').notNullable();           // e.g., "10", "true"
    table.string('description');                   // optional: human-readable explanation
    table.unique(['plan_id', 'feature_key']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('plan_features');
};
