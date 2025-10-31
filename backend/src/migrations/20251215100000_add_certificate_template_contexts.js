/**
 * Adds template context flags so admins can target tutorials and online classes independently.
 *
 * @param {import("knex").Knex} knex
 */
exports.up = function up(knex) {
  return knex.schema.alterTable("certificate_templates", (table) => {
    table
      .boolean("for_tutorials")
      .notNullable()
      .defaultTo(true);
    table
      .boolean("for_online_classes")
      .notNullable()
      .defaultTo(true);
  });
};

/**
 * Reverts the template context flags.
 *
 * @param {import("knex").Knex} knex
 */
exports.down = function down(knex) {
  return knex.schema.alterTable("certificate_templates", (table) => {
    table.dropColumn("for_tutorials");
    table.dropColumn("for_online_classes");
  });
};
