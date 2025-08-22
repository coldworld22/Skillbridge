
exports.seed = async function (knex) {
  const permission = {
    code: 'view_course',
    description: 'Permission to view courses'
  };

  await knex('permissions')
    .insert(permission)
    .onConflict('code')
    .ignore();
};
