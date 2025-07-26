exports.up = function(knex) {
  return knex.schema.createTable('tutorial_tag_map', function(table) {
    table.uuid('tutorial_id').notNullable().references('id').inTable('tutorials').onDelete('CASCADE');
    table.uuid('tag_id').notNullable().references('id').inTable('tags').onDelete('CASCADE');
    table.primary(['tutorial_id', 'tag_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tutorial_tag_map');
};
