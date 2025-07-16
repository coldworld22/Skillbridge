const db = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const userModel = require("../users/user.model");
const { sendOtpEmail } = require("../../utils/email");

const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

exports.sendOtp = async (userId, type) => {
  const user = await userModel.findById(userId);

  if ((type === "email" && user.is_email_verified) || (type === "phone" && user.is_phone_verified)) {
    return { alreadyVerified: true };
  }

  const code = type === "phone" ? "123456" : generateCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await db("verifications").insert({
    id: uuidv4(),
    user_id: userId,
    type,
    code,
    expires_at: expires,
    verified: false,
    created_at: new Date(),
  });
  if (type === "email") {
    try {
      await sendOtpEmail(user.email, code);
    } catch (err) {
      console.error("Error sending OTP email:", err.message);
    }
  } else {
    console.log(`[SMS] Phone OTP for ${user.phone}: ${code}`); // Replace with SMS provider
  }

  console.log(`[OTP] Sent ${type} code:`, code);

  return { code };
};

exports.verifyOtp = async (userId, type, code) => {
  const user = await db("users").where({ id: userId }).first();
  const updateField = type === "email" ? "is_email_verified" : "is_phone_verified";

  if (user[updateField]) {
    return { alreadyVerified: true };
  }

  const record = await db("verifications")
    .where({ user_id: userId, type, code, verified: false })
    .andWhere("expires_at", ">", new Date())
    .first();

  if (!record) throw new Error("Invalid or expired OTP");

  await db("verifications").where({ id: record.id }).update({ verified: true });

  await db("users").where({ id: userId }).update({ [updateField]: true });

  const userAfter = await db("users").where({ id: userId }).first();
  if (
    userAfter.is_email_verified &&
    userAfter.is_phone_verified &&
    userAfter.profile_complete
  ) {
    await notificationService.createNotification({
      user_id: userId,
      type: "profile",
      message:
        "Your profile is complete! You can now use the platform and all its features.",
    });

    const admins = await userModel.findAdmins();
    const firstAdmin = admins[0];
    if (firstAdmin) {
      await messageService.createMessage({
        sender_id: firstAdmin.id,
        receiver_id: userId,
        message:
          "Your profile is complete! You can now use the platform and all its features.",
      });
    }
  }
  return { alreadyVerified: false };
};
