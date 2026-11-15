// Adds text answers to assignment submissions.
// tutorial_assignment_submissions is created by a later migration
// (20250903000040), so on a fresh database it is skipped here and created
// with these columns already in place.
async function addColumns(knex, tableName) {
  if (!(await knex.schema.hasTable(tableName))) return;
  const hasTextAnswer = await knex.schema.hasColumn(tableName, "text_answer");
  const hasUpdatedAt = await knex.schema.hasColumn(tableName, "updated_at");
  if (hasTextAnswer && hasUpdatedAt) return;
  await knex.schema.alterTable(tableName, (table) => {
    if (!hasTextAnswer) table.text("text_answer");
    if (!hasUpdatedAt) table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

async function dropColumns(knex, tableName) {
  if (!(await knex.schema.hasTable(tableName))) return;
  const hasTextAnswer = await knex.schema.hasColumn(tableName, "text_answer");
  const hasUpdatedAt = await knex.schema.hasColumn(tableName, "updated_at");
  await knex.schema.alterTable(tableName, (table) => {
    if (hasTextAnswer) table.dropColumn("text_answer");
    if (hasUpdatedAt) table.dropColumn("updated_at");
  });
}

exports.up = async function (knex) {
  await addColumns(knex, "assignment_submissions");
  await addColumns(knex, "tutorial_assignment_submissions");
};

exports.down = async function (knex) {
  await dropColumns(knex, "assignment_submissions");
  await dropColumns(knex, "tutorial_assignment_submissions");
};
