const logger = require("../../utils/logger.js");
const mailService = require("../../services/mailService");
const userModel = require("./user.model");

const SUPPORT_EMAIL =
  (process.env.SUPPORT_EMAIL || process.env.SMTP_USER || "").trim() || null;

const ensureUserDetails = async (user) => {
  if (!user) return null;
  if (user.email && user.full_name && user.role) {
    return user;
  }
  if (!user.id) {
    return user;
  }
  try {
    const record = await userModel.findById(user.id);
    if (!record) {
      return user;
    }
    return { ...record };
  } catch (err) {
    logger.error("Failed to load user details for password alert", err.message);
    return user;
  }
};

const formatDisplayName = (user) => {
  if (!user) return "Unknown user";
  return user.full_name || user.email || `User ${user.id || ""}`.trim();
};

const dedupeEmails = (emails) =>
  Array.from(
    new Set(
      (emails || [])
        .map((email) => (typeof email === "string" ? email.trim() : ""))
        .filter(Boolean)
    )
  );

exports.sendPasswordChangeEmails = async ({ targetUser, actor }) => {
  try {
    const [resolvedTarget, resolvedActor] = await Promise.all([
      ensureUserDetails(targetUser),
      ensureUserDetails(actor),
    ]);

    if (!resolvedTarget?.email) {
      logger.warn(
        "Skipping password change emails because target user email is missing",
        resolvedTarget?.id
      );
      return;
    }

    const timestamp = new Date().toISOString();
    const targetName = formatDisplayName(resolvedTarget);
    const actorName = formatDisplayName(resolvedActor);
    const actorRole = resolvedActor?.role || "Unknown role";

    const supportLine = SUPPORT_EMAIL
      ? `If you did not authorize this change, please contact us immediately at ${SUPPORT_EMAIL}.`
      : "If you did not authorize this change, please contact support immediately.";

    await mailService.sendMail({
      to: resolvedTarget.email,
      subject: "Your password was changed",
      html: `
        <p>Hello ${targetName},</p>
        <p>This is a confirmation that the password for your SkillBridge account was changed on <strong>${timestamp}</strong>.</p>
        <p>${supportLine}</p>
      `,
    });

    const admins = await userModel.findAdmins();
    const adminEmails = dedupeEmails([
      ...(admins || []).map((admin) => admin.email),
      SUPPORT_EMAIL,
    ]);

    if (!adminEmails.length) {
      return;
    }

    const adminSubject = `Security alert: Password changed for ${targetName}`;
    const adminHtml = `
      <p>Hello,</p>
      <p>The password for <strong>${targetName}</strong> (${resolvedTarget.email}) was changed on <strong>${timestamp}</strong>.</p>
      <p>Change initiated by: ${actorName} (${actorRole}).</p>
      <p>If this action was unexpected, please review the account immediately.</p>
    `;

    await Promise.allSettled(
      adminEmails.map((email) =>
        mailService.sendMail({
          to: email,
          subject: adminSubject,
          html: adminHtml,
        })
      )
    );
  } catch (err) {
    logger.error("Failed to dispatch password change emails", err.message);
  }
};
