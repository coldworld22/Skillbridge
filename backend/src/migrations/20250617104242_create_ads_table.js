exports.up = function(knex) {
  return knex.schema.createTable("ads", function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("title", 255).notNullable();
    table.text("description");
    table.string("image_url", 255).notNullable();
    table.string("link_url", 255);
    table.uuid("created_by");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists("ads");
};
