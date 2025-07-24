/**
 * Instructor Profile Service
 * @file instructor.service.js
 */

const db = require("../../../config/database");

// Utility to safely parse JSON fields
const parseArrayField = (val) => {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    if (typeof val === "string") {
      return val
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return [];
  }
};


// 🔹 Get full instructor profile (user + instructor + social + certificates)
const getInstructorProfile = async (userId) => {
  const [user] = await db("users")
    .where({ id: userId })
    .select(
      "id",
      "full_name",
      "email",
      "phone",
      "avatar_url",
      "gender",
      "date_of_birth",
      "profile_complete"
    );

  const [instructor] = await db("instructor_profiles")
    .where({ user_id: userId })
    .select(
      "expertise",
      "experience",
      "bio",
      "certifications",
      "availability",
      "pricing",
      "demo_video_url"
    );

  const socialLinks = await db("user_social_links")
    .where({ user_id: userId })
    .select("platform", "url");

  const certificates = await db("instructor_certificates")
    .where({ user_id: userId })
    .select("id", "title", "file_url", "created_at");

  if (instructor) {
    instructor.expertise = parseArrayField(instructor.expertise);
    instructor.availability = parseArrayField(instructor.availability);
  }

  return {
    ...user,
    instructor,
    social_links: socialLinks,
    certificates,
  };
};

// 🔹 Update instructor user data, profile data, and social links in a transaction
const updateInstructorProfile = async (userId, userData, instructorData, socialLinks = []) => {
  await db.transaction(async (trx) => {
    // ✅ Update users table
    await trx("users").where({ id: userId }).update({
      ...userData,
      profile_complete: true,
    });

    // ✅ Upsert instructor profile
    const existing = await trx("instructor_profiles").where({ user_id: userId }).first();
    const data = {
      ...instructorData,
      expertise: instructorData.expertise
        ? JSON.stringify(instructorData.expertise)
        : null,
    };
    if (existing) {
      await trx("instructor_profiles").where({ user_id: userId }).update(data);
    } else {
      await trx("instructor_profiles").insert({ user_id: userId, ...data });
    }

    // ✅ Replace social links
    await trx("user_social_links").where({ user_id: userId }).del();
    for (const link of socialLinks) {
      if (link.url) {
        await trx("user_social_links").insert({
          user_id: userId,
          platform: link.platform,
          url: link.url,
        });
      }
    }
  });
};

// 📊 Dashboard stats for instructor dashboard
const getDashboardStats = async (userId) => {
  const [tutorialRow] = await db('tutorials')
    .where({ instructor_id: userId })
    .count();
  const [classRow] = await db('online_classes')
    .where({ instructor_id: userId })
    .count();
  const [studentRow] = await db('class_enrollments as ce')
    .join('online_classes as c', 'ce.class_id', 'c.id')
    .where('c.instructor_id', userId)
    .countDistinct('ce.user_id');
  const [upcomingRow] = await db('online_classes')
    .where({ instructor_id: userId })
    .where('start_date', '>', db.fn.now())
    .count();

  return {
    totalTutorials: parseInt(tutorialRow.count, 10) || 0,
    totalClasses: parseInt(classRow.count, 10) || 0,
    totalStudents: parseInt(studentRow.count, 10) || 0,
    upcomingSessions: parseInt(upcomingRow.count, 10) || 0,
  };
};

module.exports = {
  getInstructorProfile,
  updateInstructorProfile,
  getDashboardStats,
};
