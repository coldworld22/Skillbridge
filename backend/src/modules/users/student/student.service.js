const db = require("../../../config/database");

const DEFAULT_STUDENT_PREFERENCES = Object.freeze({
  preferred_language: "en",
  subtitles_enabled: true,
  subtitle_language: "en",
  playback_speed: 1,
  two_factor_enabled: false,
  data_sharing_opt_in: true,
  show_profile_publicly: true,
  ui_theme: "system",
  ui_reduce_motion: false,
  ui_high_contrast: false,
  ui_density: "comfortable",
});

const normalizePreferences = (prefs = {}) => {
  const merged = { ...DEFAULT_STUDENT_PREFERENCES, ...prefs };
  return {
    ...merged,
    subtitles_enabled: Boolean(merged.subtitles_enabled),
    two_factor_enabled: Boolean(merged.two_factor_enabled),
    data_sharing_opt_in: Boolean(merged.data_sharing_opt_in),
    show_profile_publicly: Boolean(merged.show_profile_publicly),
    ui_reduce_motion: Boolean(merged.ui_reduce_motion),
    ui_high_contrast: Boolean(merged.ui_high_contrast),
    playback_speed: Number(merged.playback_speed || 1),
  };
};

const pickDefined = (source = {}, keys = []) => {
  const result = {};
  keys.forEach((key) => {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }
  });
  return result;
};

const upsertStudentPreferences = async (userId, patch = {}) => {
  const sanitizedPatch = Object.entries(patch).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

  if (sanitizedPatch.playback_speed !== undefined) {
    sanitizedPatch.playback_speed = Number(sanitizedPatch.playback_speed);
  }

  const insertPayload = {
    user_id: userId,
    ...DEFAULT_STUDENT_PREFERENCES,
    ...sanitizedPatch,
  };

  await db("student_preferences")
    .insert(insertPayload)
    .onConflict("user_id")
    .merge({ ...sanitizedPatch, updated_at: new Date() });

  const updated = await db("student_preferences")
    .where({ user_id: userId })
    .first();

  return normalizePreferences(updated);
};

// 🔹 Get full student profile
const getStudentProfile = async (userId) => {
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

  const [student] = await db("student_profiles")
    .where({ user_id: userId })
    .select("education_level", "topics", "learning_goals", "identity_doc_url");

  const socialLinks = await db("user_social_links")
    .where({ user_id: userId })
    .select("platform", "url");

  return { ...user, student, social_links: socialLinks };
};

// 🔹 Update student + profile + links
const updateStudentProfile = async (userId, userData, studentData, socialLinks = []) => {
  await db("users").where({ id: userId }).update({
    ...userData,
    profile_complete: true,
    updated_at: new Date(),
  });

  const existing = await db("student_profiles").where({ user_id: userId }).first();
  if (existing) {
    await db("student_profiles").where({ user_id: userId }).update({
      ...studentData,
      updated_at: new Date(),
    });
  } else {
    await db("student_profiles").insert({ user_id: userId, ...studentData });
  }

  await db("user_social_links").where({ user_id: userId }).del();
  for (const link of socialLinks) {
    if (link.url) {
      await db("user_social_links").insert({
        user_id: userId,
        platform: link.platform,
        url: link.url,
      });
    }
  }
};

const getStudentSettings = async (userId) => {
  const [user] = await db("users")
    .where({ id: userId })
    .select(
      "id",
      "full_name",
      "email",
      "phone",
      "gender",
      "date_of_birth",
      "is_email_verified",
      "is_phone_verified"
    );

  if (!user) {
    throw new Error("Student user not found");
  }

  const prefs = await upsertStudentPreferences(userId, {});

  return {
    account: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      is_email_verified: Boolean(user.is_email_verified),
      is_phone_verified: Boolean(user.is_phone_verified),
    },
    learning: {
      preferred_language: prefs.preferred_language,
      subtitles_enabled: prefs.subtitles_enabled,
      subtitle_language: prefs.subtitle_language,
      playback_speed: prefs.playback_speed,
    },
    privacy: {
      two_factor_enabled: prefs.two_factor_enabled,
      data_sharing_opt_in: prefs.data_sharing_opt_in,
      show_profile_publicly: prefs.show_profile_publicly,
    },
    ui: {
      theme: prefs.ui_theme,
      reduce_motion: prefs.ui_reduce_motion,
      high_contrast: prefs.ui_high_contrast,
      density: prefs.ui_density,
    },
  };
};

const updateLearningPreferences = async (userId, data = {}) => {
  const patch = pickDefined(data, [
    "preferred_language",
    "subtitles_enabled",
    "subtitle_language",
    "playback_speed",
  ]);
  const prefs = await upsertStudentPreferences(userId, patch);
  return {
    preferred_language: prefs.preferred_language,
    subtitles_enabled: prefs.subtitles_enabled,
    subtitle_language: prefs.subtitle_language,
    playback_speed: prefs.playback_speed,
  };
};

const updatePrivacySettings = async (userId, data = {}) => {
  const patch = pickDefined(data, [
    "two_factor_enabled",
    "data_sharing_opt_in",
    "show_profile_publicly",
  ]);
  const prefs = await upsertStudentPreferences(userId, patch);
  return {
    two_factor_enabled: prefs.two_factor_enabled,
    data_sharing_opt_in: prefs.data_sharing_opt_in,
    show_profile_publicly: prefs.show_profile_publicly,
  };
};

const updateUiPreferences = async (userId, data = {}) => {
  const patch = pickDefined(data, [
    "ui_theme",
    "ui_reduce_motion",
    "ui_high_contrast",
    "ui_density",
  ]);
  const prefs = await upsertStudentPreferences(userId, patch);
  return {
    theme: prefs.ui_theme,
    reduce_motion: prefs.ui_reduce_motion,
    high_contrast: prefs.ui_high_contrast,
    density: prefs.ui_density,
  };
};

const updateAccountInfo = async (userId, data = {}) => {
  const patch = pickDefined(data, ["full_name", "phone", "gender", "date_of_birth"]);
  if (Object.keys(patch).length === 0) {
    return null;
  }

  if (patch.date_of_birth) {
    patch.date_of_birth = new Date(patch.date_of_birth);
  }

  await db("users")
    .where({ id: userId })
    .update({ ...patch, updated_at: new Date() });

  const [updatedUser] = await db("users")
    .where({ id: userId })
    .select(
      "id",
      "full_name",
      "email",
      "phone",
      "gender",
      "date_of_birth",
      "is_email_verified",
      "is_phone_verified"
    );

  return updatedUser;
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  getStudentSettings,
  updateLearningPreferences,
  updatePrivacySettings,
  updateUiPreferences,
  updateAccountInfo,
};
