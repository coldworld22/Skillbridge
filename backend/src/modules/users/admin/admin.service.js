// 📁 src/modules/users/admin/admin.service.js

const db = require("../../../config/database");

/**
 * Fetch admin profile data by user_id
 * @param {string} userId
 */
exports.getAdminProfile = (userId) => {
  return db("admin_profiles").where({ user_id: userId }).first();
};

/**
 * Create or update admin profile details
 * @param {string} userId
 * @param {object} data - { gender, date_of_birth, avatar_url, identity_doc_url, etc. }
 */
exports.updateAdminProfile = async (userId, data) => {
  const exists = await db("admin_profiles").where({ user_id: userId }).first();

  const profileData = {
    ...data,
    updated_at: new Date(),
  };

  if (exists) {
    await db("admin_profiles").where({ user_id: userId }).update(profileData);
  } else {
    await db("admin_profiles").insert({
      user_id: userId,
      ...profileData,
      created_at: new Date(),
    });
  }
};

// ---------------------------------------------------------------------------
// 📊 Dashboard statistics for the main admin dashboard
// ---------------------------------------------------------------------------

exports.getDashboardStats = async () => {
  const [userRow] = await db("users").count();
  const [instructorRow] = await db("users")
    .where({ role: "Instructor" })
    .count();
  const [studentRow] = await db("users")
    .where({ role: "Student" })
    .count();
  const [tutorialRow] = await db("tutorials").count();
  const [classRow] = await db("online_classes").count();

  return {
    totalUsers: parseInt(userRow.count, 10) || 0,
    instructors: parseInt(instructorRow.count, 10) || 0,
    students: parseInt(studentRow.count, 10) || 0,
    tutorials: parseInt(tutorialRow.count, 10) || 0,
    classes: parseInt(classRow.count, 10) || 0,
  };
};

// ---------------------------------------------------------------------------
// 📈 Charts data
// ---------------------------------------------------------------------------

/**
 * Get total paid revenue grouped by month
 */
exports.getMonthlyRevenue = () => {
  return db("payments")
    .select(db.raw("TO_CHAR(DATE_TRUNC('month', paid_at), 'Mon') as month"))
    .sum({ revenue: "amount" })
    .where({ status: "paid" })
    .groupByRaw("DATE_TRUNC('month', paid_at)")
    .orderByRaw("DATE_TRUNC('month', paid_at)");
};

/**
 * Count user signups grouped by month
 */
exports.getMonthlySignups = () => {
  return db("users")
    .select(db.raw("TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month"))
    .count("id as users")
    .groupByRaw("DATE_TRUNC('month', created_at)")
    .orderByRaw("DATE_TRUNC('month', created_at)");
};
