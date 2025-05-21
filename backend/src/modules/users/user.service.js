const userModel = require("./user.model");
const db = require("../../config/database");
const bcrypt = require("bcrypt");
const { Parser } = require("json2csv");

/**
 * 📦 Fetch paginated users with optional search
 */
exports.fetchUsers = async ({ search = "", page = 1, limit = 10 }) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const users = await userModel.queryUsers({ search, limit, offset });
  const total = await userModel.countUsers(search);

  return {
    users,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * 🔁 Toggle user active/inactive status
 */
exports.toggleStatus = async (id) => {
  const user = await userModel.findById(id);
  if (!user) throw new Error("User not found");

  const newStatus = user.status === "active" ? "inactive" : "active";
  return userModel.updateUser(id, { status: newStatus });
};

/**
 * 📤 Export all users (up to 10k) to CSV
 */
exports.exportUsersToCSV = async () => {
  const users = await userModel.queryUsers({ limit: 10000, offset: 0 });
  const fields = ["id", "full_name", "email", "role", "status", "profile_complete", "created_at"];
  const parser = new Parser({ fields });
  return parser.parse(users);
};

/**
 * ✏️ Update basic user fields
 * Auto-hash password if provided, and mark profile_complete if applicable
 */
exports.updateUser = async (id, data) => {
  if (data.password) {
    data.password_hash = await bcrypt.hash(data.password, 12);
    delete data.password;
  }

  if (!data.profile_complete) {
    const existing = await userModel.findById(id);
    const merged = { ...existing, ...data };

    const isComplete =
      merged.full_name &&
      merged.phone &&
      merged.role &&
      merged.status === "active";

    if (isComplete) data.profile_complete = true;
  }

  return userModel.updateUser(id, data);
};

/**
 * 🧠 Full profile update including user table, role profile, and social links
 */
exports.updateFullProfile = async (userId, data) => {
  const {
    full_name,
    phone,
    gender,
    date_of_birth,
    avatar_url,
    studentDetails,
    instructorDetails,
    socialLinks,
  } = data;

  const role = data.role?.toLowerCase();

  const [updatedUser] = await userModel.updateUser(userId, {
    full_name,
    phone,
    gender,
    date_of_birth,
    avatar_url,
    updated_at: new Date(),
  });

  if (role === "student" && studentDetails) {
    const exists = await db("student_profiles").where({ user_id: userId }).first();
    if (exists) {
      await db("student_profiles").update(studentDetails).where({ user_id: userId });
    } else {
      await db("student_profiles").insert({ ...studentDetails, user_id: userId });
    }
  }

  if (role === "instructor" && instructorDetails) {
    const exists = await db("instructor_profiles").where({ user_id: userId }).first();
    if (exists) {
      await db("instructor_profiles").update(instructorDetails).where({ user_id: userId });
    } else {
      await db("instructor_profiles").insert({ ...instructorDetails, user_id: userId });
    }
  }

  if (Array.isArray(socialLinks)) {
    await db("user_social_links").where({ user_id: userId }).del();
    for (const link of socialLinks) {
      const cleaned = link.url?.trim().startsWith("http") ? link.url.trim() : `https://${link.url.trim()}`;
      await db("user_social_links").insert({
        user_id: userId,
        platform: link.platform,
        url: cleaned,
      });
    }
  }

  const profileComplete =
    full_name && phone && gender && date_of_birth &&
    (role !== "student" || studentDetails) &&
    (role !== "instructor" || instructorDetails) &&
    Array.isArray(socialLinks) && socialLinks.length > 0;

  if (profileComplete) {
    await userModel.updateUser(userId, { profile_complete: true });
  }

  return updatedUser;
};
