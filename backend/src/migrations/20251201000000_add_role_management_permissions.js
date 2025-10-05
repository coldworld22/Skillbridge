const PERMISSION_CODES = [
  {
    code: 'view_roles',
    description: 'Permission to view roles',
  },
  {
    code: 'manage_roles',
    description: 'Permission to create and update roles',
  },
  {
    code: 'view_permissions',
    description: 'Permission to view permissions',
  },
  {
    code: 'manage_permissions',
    description: 'Permission to create and update permissions',
  },
];

const ROLE_NAMES = ['Admin', 'SuperAdmin'];

exports.up = async function up(knex) {
  await knex('permissions')
    .insert(PERMISSION_CODES)
    .onConflict('code')
    .ignore();

  const permissions = await knex('permissions')
    .select('id', 'code')
    .whereIn(
      'code',
      PERMISSION_CODES.map((permission) => permission.code),
    );

  if (permissions.length === 0) {
    return;
  }

  const roles = await knex('roles')
    .select('id', 'name')
    .whereIn('name', ROLE_NAMES);

  const roleIdLookup = roles.reduce((accumulator, role) => {
    accumulator[role.name] = role.id;
    return accumulator;
  }, {});

  const rows = [];

  permissions.forEach((permission) => {
    ROLE_NAMES.forEach((roleName) => {
      const roleId = roleIdLookup[roleName];
      if (!roleId) {
        return;
      }

      rows.push({
        role_id: roleId,
        permission_id: permission.id,
      });
    });
  });

  if (rows.length === 0) {
    return;
  }

  await knex('role_permissions').insert(rows).onConflict(['role_id', 'permission_id']).ignore();
};

exports.down = async function down(knex) {
  const permissionCodes = PERMISSION_CODES.map((permission) => permission.code);

  const permissions = await knex('permissions')
    .select('id')
    .whereIn('code', permissionCodes);

  if (permissions.length > 0) {
    const permissionIds = permissions.map((permission) => permission.id);
    await knex('role_permissions').whereIn('permission_id', permissionIds).del();
  }

  await knex('permissions').whereIn('code', permissionCodes).del();
};
