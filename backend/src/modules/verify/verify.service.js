const db = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const userModel = require("../users/user.model");
const { sendOtpEmail } = require("../../utils/email");
const smsService = require("../../services/smsService");
const AppError = require("../../utils/AppError");
const redisClient = require("../../utils/redisClient");
const logger = require("../../utils/logger.js");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { OTP_LENGTH } = require("../auth/constants");

const SALT_ROUNDS = 12;
const OTP_ATTEMPT_PREFIX = "otpAttempt:";

function getAttemptKey(userId, type) {
  return `${OTP_ATTEMPT_PREFIX}${userId}:${type}`;
}
const generateCode = () => {
  const max = Math.pow(10, OTP_LENGTH);
  return crypto.randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
};

exports.sendOtp = async (userId, type) => {
  const user = await userModel.findById(userId);

  if ((type === "email" && user.is_email_verified) || (type === "phone" && user.is_phone_verified)) {
    return { alreadyVerified: true };
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, SALT_ROUNDS);
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await db("verifications").insert({
    id: uuidv4(),
    user_id: userId,
    type,
    code: codeHash,
    expires_at: expires,
    verified: false,
    created_at: new Date(),
  });
  if (type === "email") {
    try {
      await sendOtpEmail(user.email, code);
    } catch (err) {
      throw new AppError(err.message, 503);
    }
  } else {
    try {
      await smsService.sendSMS({
        to: user.phone,
        text: `Your SkillBridge OTP is: ${code}`,
      });
    } catch (err) {
      throw new AppError(err.message, 503);
    }
  }

  return { alreadyVerified: false };
};

exports.verifyOtp = async (userId, type, code) => {
  let attempt = null;
  if (redisClient) {
    try {
      const data = await redisClient.get(getAttemptKey(userId, type));
      attempt = data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error("Failed to check OTP attempts", err);
    }
  }
  if (attempt && attempt.lockUntil && attempt.lockUntil > Date.now()) {
    throw new AppError(
      "Too many invalid OTP attempts. Try again later.",
      429
    );
  }

  const user = await db("users").where({ id: userId }).first();
  const updateField = type === "email" ? "is_email_verified" : "is_phone_verified";

  if (user[updateField]) {
    return { alreadyVerified: true };
  }

  const record = await db("verifications")
    .where({ user_id: userId, type, verified: false })
    .andWhere("expires_at", ">", new Date())
    .orderBy("created_at", "desc")
    .first();

  if (!record) throw new AppError("Invalid or expired OTP", 400);

  const match = await bcrypt.compare(code, record.code);
  if (!match) throw new Error("Invalid or expired OTP");

  await db("verifications").where({ id: record.id }).update({ verified: true });

  await db("users").where({ id: userId }).update({ [updateField]: true });

  if (redisClient) {
    try {
      await redisClient.del(getAttemptKey(userId, type));
    } catch (err) {
      logger.error("Failed to clear OTP attempts", err);
    }
  }

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
