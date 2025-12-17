exports.up = async function up(knex) {
  const hasColumn = await knex.schema.hasColumn("class_lessons", "duration");
  if (!hasColumn) {
    await knex.schema.table("class_lessons", (table) => {
      table.integer("duration").nullable();
    });
  }
};

exports.down = async function down(knex) {
  const hasColumn = await knex.schema.hasColumn("class_lessons", "duration");
  if (hasColumn) {
    await knex.schema.table("class_lessons", (table) => {
      table.dropColumn("duration");
    });
  }
};
