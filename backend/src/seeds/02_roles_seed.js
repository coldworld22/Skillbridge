exports.seed = async function (knex) {
  await knex("roles").del();
  const roles = [
    { name: "SuperAdmin", description: "Platform owner with full access", created_at: new Date() },
    { name: "Admin", description: "Administrator with management privileges", created_at: new Date() },
    { name: "Instructor", description: "Can create and manage courses", created_at: new Date() },
    { name: "Student", description: "Standard learner account", created_at: new Date() },
  ];
  await knex("roles").insert(roles);
};
