exports.up = async function(knex) {
  const hasJobTitle = await knex.schema.hasColumn('admin_profiles', 'job_title');
  const hasDepartment = await knex.schema.hasColumn('admin_profiles', 'department');

  return knex.schema.alterTable("admin_profiles", function(table) {
    if (!hasJobTitle) {
      table.string("job_title");
    }
    if (!hasDepartment) {
      table.string("department");
    }
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("admin_profiles", function(table) {
    table.dropColumn("job_title");
    table.dropColumn("department");
  });
};
