exports.up = async function up(knex) {
  return knex.schema.alterTable("payments", (table) => {
    table.string("source");
  });
};

exports.down = async function down(knex) {
  return knex.schema.alterTable("payments", (table) => {
    table.dropColumn("source");
  });
};
