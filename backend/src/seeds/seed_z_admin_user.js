const logger = require('../utils/logger.js');
const bcrypt = require("bcrypt");
const crypto = require("crypto");

exports.seed = async function(knex) {
  // Ensure the Admin role exists
  let roleRecord = await knex("roles").where({ name: "Admin" }).first();
  if (!roleRecord) {
    [roleRecord] = await knex("roles")
      .insert({
        name: "Admin",
        description: "Administrator with management privileges",
        created_at: knex.fn.now(),
      })
      .returning("*");
  }

  // 🔐 Create Admin User
  const rawPassword =
    process.env.ADMIN_INITIAL_PASSWORD || crypto.randomBytes(16).toString("hex");
  if (!process.env.ADMIN_INITIAL_PASSWORD) {
    console.log(`🔐 Generated Admin password: ${rawPassword}`);
  }
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const [adminUserId] = await knex("users")
    .insert({
      full_name: "Admin User",
      email: "admin@eduskillbridge.net",
      phone: "+10000000000",
      password_hash: hashedPassword,
      role: "Admin",
      avatar_url: null,
      is_email_verified: true,
      status: "active",
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    })
    .returning("id");

  // Create matching admin profile
  await knex("admin_profiles").insert({
    user_id: adminUserId.id || adminUserId,
    job_title: "Administrator",
    department: "Management",
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  });

  // 🔗 Link user to role (if using a many-to-many system)
  await knex("user_roles").insert({
    user_id: adminUserId.id || adminUserId,
    role_id: roleRecord.id || roleRecord,
  });

  logger.log("✅ Admin user seeded");
};
