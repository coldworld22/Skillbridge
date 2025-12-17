exports.up = async function up(knex) {
  const hasAllow = await knex.schema.hasColumn("tutorials", "allow_installments");
  const hasCount = await knex.schema.hasColumn("tutorials", "installments");

  return knex.schema.alterTable("tutorials", (table) => {
    if (!hasAllow) {
      table.boolean("allow_installments").notNullable().defaultTo(false);
    }
    if (!hasCount) {
      table.integer("installments").notNullable().defaultTo(1);
    }
  });
};

exports.down = async function down(knex) {
  const hasAllow = await knex.schema.hasColumn("tutorials", "allow_installments");
  const hasCount = await knex.schema.hasColumn("tutorials", "installments");

  if (!hasAllow && !hasCount) {
    return;
  }

  return knex.schema.alterTable("tutorials", (table) => {
    if (hasAllow) {
      table.dropColumn("allow_installments");
    }
    if (hasCount) {
      table.dropColumn("installments");
    }
  });
};

