const db = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.sendOtp = async (userId, type) => {
  const code = generateCode();
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

  console.log(`[OTP] Sent ${type} code:`, code); // Replace with email/SMS sending
};

exports.verifyOtp = async (userId, type, code) => {
  const record = await db("verifications")
    .where({ user_id: userId, type, code, verified: false })
    .andWhere("expires_at", ">", new Date())
    .first();

  if (!record) throw new Error("Invalid or expired OTP");

  await db("verifications").where({ id: record.id }).update({ verified: true });

  const updateField = type === "email" ? "is_email_verified" : "is_phone_verified";

  await db("users").where({ id: userId }).update({ [updateField]: true });
};
