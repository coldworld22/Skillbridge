exports.up = async function(knex) {
  // 🔍 Step 1: Skip if FK already exists
  const exists = await knex.raw(`
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'tutorials_category_id_foreign'
      AND table_name = 'tutorials';
  `);

  // ✅ Step 2: Alter category_id to UUID
  await knex.schema.alterTable('tutorials', (table) => {
    table.uuid('category_id').alter();
  });

  // ✅ Step 3: Add FK ONLY IF it doesn't exist
  if (exists.rows.length === 0) {
    await knex.schema.alterTable('tutorials', (table) => {
      table
        .foreign('category_id', 'tutorials_category_id_foreign')
        .references('id')
        .inTable('categories')
        .onDelete('SET NULL');
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.alterTable('tutorials', (table) => {
    table.dropForeign('category_id', 'tutorials_category_id_foreign');
    table.integer('category_id').alter();
  });
};
