exports.up = async function (knex) {
  await knex.schema.alterTable("certificates", (table) => {
    table.string("recipient_name_override");
    table.string("instructor_name_override");
    table.string("platform_name_override");
    table.string("grade");
    table.string("verification_url");
    table.jsonb("details");
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("certificates", (table) => {
    table.dropColumn("details");
    table.dropColumn("verification_url");
    table.dropColumn("grade");
    table.dropColumn("platform_name_override");
    table.dropColumn("instructor_name_override");
    table.dropColumn("recipient_name_override");
  });
};
