exports.up = function(knex) {
  return knex.schema.createTable('ad_analytics', function(table) {
    table.uuid('ad_id').primary().references('id').inTable('ads').onDelete('CASCADE');
    table.integer('views').defaultTo(0);
    table.integer('clicks').defaultTo(0);
    table.decimal('ctr', 8, 4).defaultTo(0);
    table.integer('unique_viewers').defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('ad_analytics');
};
