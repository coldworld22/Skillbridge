const bcrypt = require("bcrypt");

exports.seed = async function(knex) {
  // Clear existing records (optional in dev environments)
  await knex("user_roles").del();
  await knex("users").del();
  await knex("roles").del();

  // ✅ Create SuperAdmin Role
  const [superAdminRoleId] = await knex("roles")
    .insert({
      name: "SuperAdmin",
      description: "Platform owner with full access",
      created_at: knex.fn.now(),
    })
    .returning("id");

  // 🔐 Create SuperAdmin User
  const hashedPassword = await bcrypt.hash("supersecure123", 10); // Use a stronger password in production

  const [superAdminUserId] = await knex("users")
    .insert({
      full_name: "Platform Owner",
      email: "superadmin@skillbridge.com",
      phone: "1234567890",
      password_hash: hashedPassword,
      role: "SuperAdmin", // ✅ Role matches updated enum constraint
      avatar_url: null,
      is_email_verified: true,
      is_phone_verified: true,
      status: "active",
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    })
    .returning("id");

  // 🔗 Link user to role (if using a many-to-many system)
  await knex("user_roles").insert({
    user_id: superAdminUserId.id || superAdminUserId,
    role_id: superAdminRoleId.id || superAdminRoleId,
  });

  console.log("✅ SuperAdmin seeded");
};