const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { verifyToken } = require("../../../middleware/auth/authMiddleware");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../../middleware/tenant");
const AppError = require("../../../utils/AppError");
const { sendMail } = require("../../../services/mailService");
const { frontendBase } = require("../../../utils/frontend");
const userModel = require("../../users/user.model");
const db = require("../../../config/database");

router.post("/accept-token", async (req, res, next) => {
  try {
    const token = req.body?.token || req.query?.token;
    if (!token) throw new AppError("Invite token is required", 400);

    const membership = await db("tenant_memberships")
      .where({ invite_token: token })
      .first();
    if (!membership) throw new AppError("Invite not found", 404);

    if (membership.status === "active") {
      return res.json({ message: "Already a member", data: membership });
    }

    const [updated] = await db("tenant_memberships")
      .where({ id: membership.id })
      .update({
        status: "active",
        invite_token: null,
        updated_at: new Date(),
      })
      .returning("*");

    const tenant = await db("tenants")
      .where({ id: membership.tenant_id })
      .first(["id", "name", "slug"]);

    res.json({
      message: "Membership activated",
      data: { ...(updated || membership), tenant },
    });
  } catch (err) {
    next(err);
  }
});

router.use(
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("user.invite"),
);

router.post("/", async (req, res, next) => {
  try {
    const { email, role = "student" } = req.body || {};
    if (!email) throw new AppError("Email is required", 400);
    const normalizedEmail = String(email).trim().toLowerCase();

    let user = await userModel.findByEmail(normalizedEmail);
    if (!user) {
      const [created] = await userModel.insertUser({
        id: uuidv4(),
        full_name: normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role: role,
        status: "pending",
        is_email_verified: false,
        profile_complete: false,
        created_at: new Date(),
        updated_at: new Date(),
      });
      user = created || (await userModel.findByEmail(normalizedEmail));
    }

    const existingMembership = await db("tenant_memberships")
      .where({ tenant_id: req.tenant.id, user_id: user.id })
      .first();
    if (existingMembership) {
      return res
        .status(200)
        .json({ message: "User already invited", data: existingMembership });
    }

    const inviteToken = uuidv4();
    const payload = {
      id: uuidv4(),
      tenant_id: req.tenant.id,
      user_id: user.id,
      role: role,
      status: "pending",
      invited_by: req.user.id,
      invite_token: inviteToken,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const [membership] = await db("tenant_memberships")
      .insert(payload)
      .returning("*");

    try {
      const inviteLink = `${frontendBase}/auth/accept-invite?token=${inviteToken}`;
      await sendMail({
        to: normalizedEmail,
        subject: "You have been invited",
        html: `<p>You have been invited to join ${req.tenant.slug || "our platform"}.</p><p><a href="${inviteLink}">Accept invite</a></p>`,
      });
    } catch (_) {
      /* ignore mail errors */
    }

    res.status(200).json({ message: "Invite sent", data: membership || payload });
  } catch (err) {
    next(err);
  }
});

router.post("/accept", async (req, res, next) => {
  try {
    const { tenant_id } = req.body || {};
    const userId = req.user?.id;
    if (!tenant_id || !userId) throw new AppError("Invalid request", 400);

    const membership = await db("tenant_memberships")
      .where({ tenant_id, user_id: userId })
      .first();
    if (!membership) throw new AppError("Invite not found", 404);
    if (membership.status === "revoked" || isInviteExpired(membership)) {
      throw new AppError("Invite expired", 410);
    }
    if (membership.status === "active") {
      return res.json({ message: "Already a member", data: membership });
    }
    const [updated] = await db("tenant_memberships")
      .where({ id: membership.id })
      .update({ status: "active", updated_at: new Date() })
      .returning("*");

    res.json({ message: "Membership activated", data: updated || membership });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
