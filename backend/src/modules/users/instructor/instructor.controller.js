/**
 * @file instructor.controller.js
 */
const bcrypt = require("bcrypt");
const db = require("../../../config/database");
const fs = require("fs");
const path = require("path");


/**
 * @desc Get instructor profile
 * @route GET /api/users/instructor/profile
 * @access Instructor
 */
exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  const [user] = await db("users")
    .where({ id: userId })
    .select(
      "id", "full_name", "email", "phone",
      "gender", "date_of_birth", "avatar_url",
      "is_email_verified", "is_phone_verified",
      "profile_complete", "created_at", "updated_at"
    );

  const [instructor] = await db("instructor_profiles")
    .where({ user_id: userId })
    .select(
      "expertise", "experience", "certifications",
      "availability", "pricing", "demo_video_url"
    );

  const socialLinks = await db("user_social_links")
    .where({ user_id: userId })
    .select("platform", "url");

  const certificates = await db("instructor_certificates")
    .where({ user_id: userId })
    .select("id", "title", "file_url", "created_at");

  res.json({ ...user, instructor, social_links: socialLinks, certificates });
};


/**
 * @desc Toggle instructor online/offline status
 * @route PATCH /api/users/instructor/status
 * @access Instructor
 */
exports.toggleStatus = async (req, res) => {
    const userId = req.user.id;
    const { is_online } = req.body;

    if (typeof is_online !== "boolean") {
        return res.status(400).json({ message: "is_online must be true or false." });
    }

    await db("users").where({ id: userId }).update({ is_online });

    res.json({ message: `Status set to ${is_online ? "online" : "offline"}` });
};

/**
 * @desc Upload a certificate file
 * @route POST /api/instructor/certificates
 * @access Instructor
 */
exports.uploadCertificate = async (req, res) => {
    const userId = req.user.id;
    const { title } = req.body;
    const file = req.file;

    if (!title || !file) {
        return res.status(400).json({ message: "Title and file are required." });
    }

    const fileUrl = `/uploads/certificates/instructor/${file.filename}`;
    const [inserted] = await db("instructor_certificates")
        .insert({ user_id: userId, title, file_url: fileUrl })
        .returning(["id", "title", "file_url"]);

    res.json(inserted);
};

/**
 * @desc Delete a certificate file
 * @route DELETE /api/instructor/certificates/:id
 * @access Instructor
 */
exports.deleteCertificate = async (req, res) => {
    const userId = req.user.id;
    const certId = req.params.id;

    const cert = await db("instructor_certificates")
        .where({ id: certId, user_id: userId })
        .first();

    if (!cert) {
        return res.status(404).json({ message: "Certificate not found." });
    }

    const filePath = path.join(__dirname, "../../../../", cert.file_url);
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
        console.warn("Could not delete file:", err.message);
    }

    await db("instructor_certificates").where({ id: certId }).del();

    res.json({ message: "Certificate deleted successfully." });
};

/**
 * @desc Update instructor profile
 * @route PUT /api/users/instructor/profile
 * @access Instructor
 */
exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const {
        full_name, phone, gender, date_of_birth,
        expertise, experience, certifications,
        availability, pricing, demo_video_url,
        social_links
    } = req.body;

    await db("users")
        .where({ id: userId })
        .update({ full_name, phone, gender, date_of_birth, profile_complete: true });

    const exists = await db("instructor_profiles").where({ user_id: userId }).first();
    if (exists) {
        await db("instructor_profiles")
            .where({ user_id: userId })
            .update({ expertise, experience, certifications, availability, pricing, demo_video_url });
    } else {
        await db("instructor_profiles").insert({ user_id: userId, expertise, experience, certifications, availability, pricing, demo_video_url });
    }

    await db("user_social_links").where({ user_id: userId }).del();
    if (Array.isArray(social_links)) {
        for (const link of social_links) {
            if (link.url) {
                await db("user_social_links").insert({ user_id: userId, platform: link.platform, url: link.url });
            }
        }
    }

    res.json({ message: "Profile updated successfully" });
};

/**
 * @desc Check if instructor profile is complete
 * @route GET /api/users/instructor/profile/status
 * @access Instructor
 */
exports.getProfileStatus = async (req, res) => {
    const userId = req.user.id;

    const [user] = await db("users")
        .where({ id: userId })
        .select("profile_complete");

    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    res.json({ profile_complete: user.profile_complete });
};


/**
 * @desc Delete instructor avatar
 * @route DELETE /api/users/instructor/:id/avatar
 * @access Instructor
 */
exports.deleteAvatar = async (req, res) => {
    const userId = req.params.id;

    const [user] = await db("users").where({ id: userId }).select("avatar_url");
    if (!user || !user.avatar_url) {
        return res.status(404).json({ message: "Avatar not found." });
    }

    const filePath = path.join(__dirname, "../../../../", user.avatar_url);
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
        console.error("❌ Failed to delete avatar:", err.message);
    }

    await db("users").where({ id: userId }).update({ avatar_url: null });

    res.json({ message: "Avatar deleted successfully." });
};

/**
 * @desc Delete instructor demo video
 * @route DELETE /api/users/instructor/:id/demo
 * @access Instructor
 */
exports.deleteDemoVideo = async (req, res) => {
    const userId = req.params.id;

    const [profile] = await db("instructor_profiles").where({ user_id: userId }).select("demo_video_url");
    if (!profile || !profile.demo_video_url) {
        return res.status(404).json({ message: "Demo video not found." });
    }

    const filePath = path.join(__dirname, "../../../../", profile.demo_video_url);
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
        console.error("❌ Failed to delete demo video:", err.message);
    }

    await db("instructor_profiles").where({ user_id: userId }).update({ demo_video_url: null });

    res.json({ message: "Demo video deleted successfully." });
};



/**
 * @desc Change instructor password
 * @route PATCH /api/users/instructor/change-password
 * @access Instructor
 */
exports.changePassword = async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters." });
    }

    const [user] = await db("users").where({ id: userId }).select("password_hash");
    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
        return res.status(401).json({ message: "Current password is incorrect." });
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await db("users").where({ id: userId }).update({
        password_hash: newHash,
        updated_at: new Date(),
    });

    res.json({ message: "Password changed successfully." });
};

/**
 * @desc Get instructor availability
 * @route GET /api/users/instructor/availability
 * @access Instructor
 */
exports.getAvailability = async (req, res) => {
    const userId = req.user.id;
    const [profile] = await db('instructor_profiles')
        .where({ user_id: userId })
        .select('availability');

    let availability = [];
    if (profile && profile.availability) {
        try {
            availability = JSON.parse(profile.availability);
        } catch (_) {
            availability = [];
        }
    }

    res.json({ availability });
};

/**
 * @desc Update instructor availability
 * @route PATCH /api/users/instructor/availability
 * @access Instructor
 */
exports.updateAvailability = async (req, res) => {
    const userId = req.user.id;
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
        return res.status(400).json({ message: 'Availability must be an array' });
    }

    await db('instructor_profiles')
        .where({ user_id: userId })
        .update({ availability: JSON.stringify(availability) });

    res.json({ message: 'Availability updated successfully' });
};
