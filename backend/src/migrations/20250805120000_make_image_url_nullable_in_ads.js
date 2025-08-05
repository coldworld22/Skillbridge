exports.up = function (knex) {
  return knex.schema.alterTable('ads', function (table) {
    table.string('image_url').nullable().alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('ads', function (table) {
    table.string('image_url').notNullable().alter();
  });
};
