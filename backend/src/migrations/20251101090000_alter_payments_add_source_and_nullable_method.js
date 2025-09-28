exports.up = async function (knex) {
  await knex.schema.alterTable("payments", (table) => {
    table.string("source");
  });

  await knex.schema.alterTable("payments", (table) => {
    table.uuid("method_id").nullable().alter();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("payments", (table) => {
    table.dropColumn("source");
  });

  await knex.schema.alterTable("payments", (table) => {
    table.uuid("method_id").notNullable().alter();
  });
};
