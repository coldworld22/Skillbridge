exports.up = async function (knex) {
  // add temporary uuid column
  await knex.schema.table('tutorials', (table) => {
    table.uuid('category_id_tmp');
  });

  // attempt to map existing integer category ids to uuid using created order
  const categories = await knex('categories').select('id').orderBy('created_at');
  const tutorials = await knex('tutorials');
  for (const t of tutorials) {
    const idx = t.category_id ? t.category_id - 1 : null;
    const newId = idx != null && categories[idx] ? categories[idx].id : null;
    await knex('tutorials').where({ id: t.id }).update({ category_id_tmp: newId });
  }

  await knex.schema.table('tutorials', (table) => {
    table.dropForeign('category_id');
    table.dropColumn('category_id');
  });
  await knex.schema.table('tutorials', (table) => {
    table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
  });

  await knex('tutorials').update({ category_id: knex.raw('category_id_tmp') });

  await knex.schema.table('tutorials', (table) => {
    table.dropColumn('category_id_tmp');
  });
};

exports.down = async function (knex) {
  await knex.schema.table('tutorials', (table) => {
    table.integer('category_id_tmp');
  });

  const categories = await knex('categories').select('id').orderBy('created_at');
  const tutorials = await knex('tutorials');
  for (const t of tutorials) {
    let idx = categories.findIndex(c => c.id === t.category_id);
    idx = idx !== -1 ? idx + 1 : null;
    await knex('tutorials').where({ id: t.id }).update({ category_id_tmp: idx });
  }

  await knex.schema.table('tutorials', (table) => {
    table.dropForeign('category_id');
    table.dropColumn('category_id');
  });
  await knex.schema.table('tutorials', (table) => {
    table.integer('category_id').references('id').inTable('categories').onDelete('SET NULL');
  });

  await knex('tutorials').update({ category_id: knex.raw('category_id_tmp') });

  await knex.schema.table('tutorials', (table) => {
    table.dropColumn('category_id_tmp');
  });
};
