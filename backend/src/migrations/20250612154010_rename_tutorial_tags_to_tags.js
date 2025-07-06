exports.up = function(knex) {
  return knex.schema.renameTable("tutorial_tags", "tags");
};

exports.down = function(knex) {
  return knex.schema.renameTable("tags", "tutorial_tags");
};
