// 📁 src/modules/users/admin/admin.service.js

const db = require("../../../config/database");
const logger = require("../../../utils/logger.js");

/**
 * Fetch admin profile data by user_id
 * @param {string} userId
 */
exports.getAdminProfile = (userId) => {
  return db("admin_profiles").where({ user_id: userId }).first();
};

/**
 * Helper to create or update an admin profile
 * @param {object} dbConn - Knex instance
 * @param {string} userId
 * @param {object} profileData
 */
exports.upsertAdminProfile = async (dbConn, userId, profileData) => {
  try {
    const existing = await dbConn("admin_profiles").where({ user_id: userId }).first();

    const data = {
      ...profileData,
      updated_at: new Date(),
    };

    if (existing) {
      await dbConn("admin_profiles").where({ user_id: userId }).update(data);
    } else {
      await dbConn("admin_profiles").insert({
        user_id: userId,
        ...data,
        created_at: new Date(),
      });
    }
  } catch (error) {
    logger.error("Failed to upsert admin profile", error.message);
    throw error;
  }
};

/**
 * Create or update admin profile details using default db connection
 * @param {string} userId
 * @param {object} data - { gender, date_of_birth, avatar_url, identity_doc_url, etc. }
 */
exports.updateAdminProfile = (userId, data) =>
  exports.upsertAdminProfile(db, userId, data);

// ---------------------------------------------------------------------------
// 📊 Dashboard statistics for the main admin dashboard
// ---------------------------------------------------------------------------

exports.getDashboardStats = async () => {
  const [
    userRow,
    instructorRow,
    studentRow,
    tutorialRow,
    classRow,
    revenueRows,
    signupRows,
    categoryRows,
    instructorRows,
  ] = await Promise.all([
    db("users").count().first(),
    db("users").where({ role: "Instructor" }).count().first(),
    db("users").where({ role: "Student" }).count().first(),
    db("tutorials").count().first(),
    db("online_classes").count().first(),
    db("payments")
      .where({ status: "paid" })
      .where("created_at", ">=", db.raw("date_trunc('month', now()) - interval '5 months'"))
      .select(
        db.raw("TO_CHAR(date_trunc('month', created_at), 'Mon') as month")
      )
      .sum({ revenue: "amount" })
      .groupByRaw("date_trunc('month', created_at)")
      .orderByRaw("date_trunc('month', created_at)"),
    db("users")
      .where("created_at", ">=", db.raw("date_trunc('month', now()) - interval '5 months'"))
      .select(
        db.raw("TO_CHAR(date_trunc('month', created_at), 'Mon') as month")
      )
      .count("* as users")
      .groupByRaw("date_trunc('month', created_at)")
      .orderByRaw("date_trunc('month', created_at)"),
    db("tutorials as t")
      .leftJoin("categories as c", "t.category_id", "c.id")
      .select(db.raw("COALESCE(c.name, 'Uncategorized') as name"))
      .count("t.id as value")
      .groupBy("name")
      .orderBy("value", "desc"),
    db("tutorials as t")
      .leftJoin("users as u", "t.instructor_id", "u.id")
      .select("u.full_name as instructor")
      .count("t.id as tutorials")
      .groupBy("u.full_name")
      .orderBy("tutorials", "desc")
      .limit(10),
  ]);

  return {
    totalUsers: parseInt(userRow.count, 10) || 0,
    instructors: parseInt(instructorRow.count, 10) || 0,
    students: parseInt(studentRow.count, 10) || 0,
    tutorials: parseInt(tutorialRow.count, 10) || 0,
    classes: parseInt(classRow.count, 10) || 0,
    monthlyRevenue: revenueRows.map((r) => ({
      month: r.month,
      revenue: parseFloat(r.revenue) || 0,
    })),
    monthlySignups: signupRows.map((r) => ({
      month: r.month,
      users: parseInt(r.users, 10) || 0,
    })),
    tutorialsByCategory: categoryRows.map((r) => ({
      name: r.name,
      value: parseInt(r.value, 10) || 0,
    })),
    instructorTutorialCount: instructorRows.map((r) => ({
      instructor: r.instructor,
      tutorials: parseInt(r.tutorials, 10) || 0,
    })),
  };
};
