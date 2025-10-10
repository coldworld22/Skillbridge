exports.up = async function up(knex) {
  return knex.schema.alterTable("payments", (table) => {
    table.uuid("method_id").nullable().alter();
  });
};

exports.down = async function down(knex) {
  return knex.schema.alterTable("payments", (table) => {
    table.uuid("method_id").notNullable().alter();
  });
};
