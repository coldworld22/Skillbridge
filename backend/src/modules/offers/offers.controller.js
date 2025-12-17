const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./offers.service");
const tagService = require("./offerTag.service");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const mailService = require("../../services/mailService");
const groupService = require("../groups/groups.service");
const slugify = require("slugify");
const db = require("../../config/database");
const { getActiveInstructorPlan } = require("../plans/instructor.helper");
const {
  getActiveStudentPlanId,
} = require("../plans/subscription.helper");
const planService = require("../plans/plans.service");
const { isAdminRole } = require("../../utils/role");

const normalizePlanSlug = (slugOrName) => {
  if (!slugOrName) return "";
  let normalized = String(slugOrName).trim().toLowerCase();
  if (!normalized) return "";
  normalized = normalized.replace(/\s+/g, "-");
  if (normalized.endsWith("-plan")) {
    normalized = normalized.slice(0, -5);
  }
  return normalized;
};

const STUDENT_PLAN_ALIASES = {
  basic: "basic",
  "student-basic": "basic",
  starter: "basic",
  "student-starter": "basic",
  regular: "regular",
  "student-regular": "regular",
  standard: "regular",
  "student-standard": "regular",
  plus: "regular",
  "student-plus": "regular",
  prime: "prime",
  "student-prime": "prime",
  premium: "prime",
  "student-premium": "prime",
};

const INSTRUCTOR_PLAN_ALIASES = {
  basic: "basic",
  "instructor-basic": "basic",
  starter: "basic",
  "instructor-starter": "basic",
  regular: "regular",
  "instructor-regular": "regular",
  standard: "regular",
  "instructor-standard": "regular",
  plus: "regular",
  "instructor-plus": "regular",
  prime: "prime",
  "instructor-prime": "prime",
  premium: "prime",
  "instructor-premium": "prime",
  pro: "prime",
  "instructor-pro": "prime",
};

const STUDENT_OFFER_LIMITS = {
  basic: 1,
  regular: 5,
  prime: 15,
};

const INSTRUCTOR_OFFER_LIMITS = {
  basic: 1,
  regular: 5,
  prime: 15,
};

const resolvePlanTier = (slugOrName, role) => {
  const normalized = normalizePlanSlug(slugOrName);
  if (!normalized) return "";
  const aliasMap = role === "instructor" ? INSTRUCTOR_PLAN_ALIASES : STUDENT_PLAN_ALIASES;
  if (aliasMap[normalized]) return aliasMap[normalized];
  const withoutPrefix = normalized.replace(/^(student|instructor)-/, "");
  if (aliasMap[withoutPrefix]) return aliasMap[withoutPrefix];
  return withoutPrefix;
};

const getOfferLimitForPlan = (role, tier) => {
  if (!tier) return null;
  const limits = role === "instructor" ? INSTRUCTOR_OFFER_LIMITS : STUDENT_OFFER_LIMITS;
  return Object.prototype.hasOwnProperty.call(limits, tier) ? limits[tier] : null;
};

const buildLimitReachedMessage = (role, tier, limit) => {
  if (!tier || !limit) {
    return role === "instructor"
      ? "You have reached the offer limit for your current instructor plan."
      : "You have reached the request limit for your current plan.";
  }

  if (role === "instructor") {
    if (tier === "basic") {
      return `You have reached the Instructor Basic plan limit (${limit} active offer). Upgrade to Instructor Regular or Prime for more capacity.`;
    }
    if (tier === "regular") {
      return `You have reached the Instructor Regular plan limit (${limit} active offers). Upgrade to Instructor Prime for additional capacity.`;
    }
    if (tier === "prime") {
      return `You have reached the Instructor Prime plan limit (${limit} active offers). Close an existing offer or contact support for higher limits.`;
    }
    return `You have reached the offer limit for your instructor plan (${limit} active offers).`;
  }

  if (tier === "basic") {
    return `You have reached the Basic plan limit (${limit} active request). Upgrade to Regular or Prime for more requests.`;
  }
  if (tier === "regular") {
    return `You have reached the Regular plan limit (${limit} active requests). Upgrade to Prime for additional requests.`;
  }
  if (tier === "prime") {
    return `You have reached the Prime plan limit (${limit} active requests). Close an existing request or contact support for higher limits.`;
  }
  return `You have reached the request limit for your plan (${limit} active requests).`;
};

const parseExpirationInput = (rawValue) => {
  if (rawValue === undefined || rawValue === null) return null;

  const str = String(rawValue).trim();
  if (!str) return null;

  const timestamp = Date.parse(str);
  if (Number.isNaN(timestamp)) {
    const error = new Error("Invalid expiration date");
    error.status = 400;
    throw error;
  }

  const date = new Date(timestamp);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date;
};

const parseBooleanQuery = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value !== "string") return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
};

exports.createOffer = catchAsync(async (req, res) => {
  const {
    tags: rawTags,
    title,
    description,
    budget,
    timeframe,
    offer_type,
    expires_at,
    group_id,
  } = req.body;

  const primaryRole = String(req.user.role || "").toLowerCase();
  const roles = Array.isArray(req.user.roles) && req.user.roles.length
    ? req.user.roles.map((role) => String(role).toLowerCase())
    : [primaryRole].filter(Boolean);
  const isPrivileged =
    roles.includes("admin") || roles.includes("superadmin");

  let offerLimit = null;
  let planTier = null;
  let primaryPlanRole = null;

  if (!isPrivileged) {
    if (roles.includes("instructor")) {
      const plan = await getActiveInstructorPlan(req.user.id);
      if (!plan) {
        return res.status(403).json({
          message:
            "You need an active Instructor plan to post offers. Subscribe to Instructor Basic, Regular, or Prime to continue.",
        });
      }
      planTier = resolvePlanTier(plan.slug || plan.name, "instructor");
      const limit = getOfferLimitForPlan("instructor", planTier);
      if (limit !== null) {
        offerLimit = limit;
        primaryPlanRole = "instructor";
      }
    } else if (roles.includes("student")) {
      const planId = await getActiveStudentPlanId(req.user.id);
      if (!planId) {
        return res.status(403).json({
          message:
            "You need an active student subscription to post learning requests.",
        });
      }
      const plan = await planService.getPlanById(planId);
      planTier = resolvePlanTier(plan?.slug || plan?.name, "student");
      const limit = getOfferLimitForPlan("student", planTier);
      if (limit === null) {
        return res.status(403).json({
          message:
            "Your current plan does not include posting learning requests. Upgrade to a student plan that supports learning requests (Basic, Regular, or Prime).",
        });
      }
      offerLimit = limit;
      primaryPlanRole = "student";
    }
  }

  if (offerLimit !== null && offerLimit !== undefined) {
    const activeOffers = await service.countActiveOffersByUser(req.user.id);
    if (activeOffers >= offerLimit) {
      return res.status(403).json({
        message: buildLimitReachedMessage(
          primaryPlanRole || (roles.includes("student") ? "student" : "instructor"),
          planTier,
          offerLimit
        ),
      });
    }
  }

  const normalizedGroupId =
    typeof group_id === "string" && group_id.trim().length
      ? group_id.trim()
      : null;
  if (normalizedGroupId) {
    const group = await groupService.getGroupById(normalizedGroupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
  }

  const data = {
    id: uuidv4(),
    student_id: req.user.id,
    title,
    description,
    budget,
    timeframe,
    offer_type,
    status: "open",
  };
  if (normalizedGroupId) {
    data.group_id = normalizedGroupId;
  }

  const fee = service.calculateOfferFee(req.user);
  if (fee > 0) data.fee = fee;

  let parsedExpiration = null;
  try {
    parsedExpiration = parseExpirationInput(expires_at);
  } catch (err) {
    return res
      .status(err.status || err.statusCode || 400)
      .json({ message: err.message || "Invalid expiration date" });
  }

  if (parsedExpiration) {
    if (parsedExpiration.getTime() <= Date.now()) {
      return res
        .status(400)
        .json({ message: "Expiration must be in the future" });
    }
    data.expires_at = parsedExpiration.toISOString();
  }

  let tags = [];
  if (rawTags) {
    try {
      tags = typeof rawTags === "string" ? JSON.parse(rawTags) : rawTags;
      if (!Array.isArray(tags)) {
        return res.status(400).json({ message: "Tags must be an array" });
      }
    } catch (e) {
      return res.status(400).json({ message: "Invalid tags format" });
    }
  }
  const offer = await service.createOffer(data);
  if (tags.length) {
    const tagIds = [];
    for (const name of tags) {
      const existing = await tagService.findByName(name);
      const tag =
        existing ||
        (await tagService.createTag({
          name,
          slug: slugify(name, { lower: true, strict: true }),
        }));
      tagIds.push(tag.id);
    }
    await service.addOfferTags(offer.id, tagIds);
    offer.tags = await service.getOfferTags(offer.id);
  }

  const instructors = await userModel.findInstructors();
  const students = await userModel.findStudents();
  const admins = await userModel.findAdmins();
  const message = `New offer from ${req.user.full_name} (${req.user.role})`;

  let recipients = [];
  if (req.user.role && req.user.role.toLowerCase() === "instructor") {
    recipients = [...students, ...admins];
  } else {
    recipients = [...instructors, ...admins];
  }

  await Promise.all([
    ...recipients.map((u) =>
      notificationService.createNotification({
        user_id: u.id,
        type: "new_offer",
        message,
      })
    ),
    ...recipients.map((u) =>
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: u.id,
        message,
      })
    ),
    ...recipients
      .filter((u) => u.email)
      .map((u) =>
        mailService.sendMail({
          to: u.email,
          subject: "New offer posted",
          html: `<p>${message}</p>`,
        })
      ),
  ]);

  sendSuccess(res, offer, "Offer created");
});

exports.getOffers = catchAsync(async (req, res) => {
  const viewer = req.user || null;
  const roles = viewer?.roles?.length
    ? viewer.roles
    : viewer?.role
    ? [viewer.role]
    : [];
  const isAdmin = isAdminRole(roles);

  const requestedScope = String(req.query.scope || "")
    .trim()
    .toLowerCase();
  let scope = "public";
  if (requestedScope === "admin") {
    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access only" });
    }
    scope = "admin";
  }

  const filters = {
    scope,
    viewerId: viewer?.id || null,
    includeMine: parseBooleanQuery(req.query.includeMine) && !!viewer,
  };

  const status = String(req.query.status || "").trim().toLowerCase();
  if (status && ["open", "closed", "cancelled"].includes(status)) {
    filters.status = status;
  }

  const offerType = String(req.query.offerType || "").trim().toLowerCase();
  if (offerType && ["class", "tutorial"].includes(offerType)) {
    filters.offerType = offerType;
  }

  const ownerRole = String(req.query.ownerRole || "").trim().toLowerCase();
  if (ownerRole && ["student", "instructor"].includes(ownerRole)) {
    filters.ownerRole = ownerRole;
  }

  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";
  if (search) {
    filters.search = search;
  }

  const orderBy = String(req.query.orderBy || "").trim().toLowerCase();
  if (["created_at", "updated_at", "expires_at"].includes(orderBy)) {
    filters.orderBy = orderBy;
  }

  const orderDirection = String(req.query.orderDirection || "")
    .trim()
    .toLowerCase();
  if (["asc", "desc"].includes(orderDirection)) {
    filters.orderDirection = orderDirection;
  }

  const offers = await service.getOffers(filters);
  sendSuccess(res, offers);
});

exports.getOfferById = catchAsync(async (req, res) => {
  const viewer = req.user || null;
  const roles = viewer?.roles?.length
    ? viewer.roles
    : viewer?.role
    ? [viewer.role]
    : [];
  const isAdmin = isAdminRole(roles);

  const requestedScope = String(req.query.scope || "")
    .trim()
    .toLowerCase();
  let scope = isAdmin ? "admin" : "public";
  if (requestedScope === "admin") {
    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access only" });
    }
    scope = "admin";
  }

  const offer = await service.getOfferById(req.params.id, {
    scope,
    viewerId: viewer?.id || null,
    includeMine: !!viewer,
  });
  sendSuccess(res, offer);
});

exports.updateOffer = catchAsync(async (req, res) => {
  const existing = await service.getOfferById(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: "Offer not found" });
  }

  if (
    req.user.role?.toLowerCase() !== "admin" &&
    req.user.id !== existing.student_id
  ) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const { tags: rawTags, expires_at: rawExpiresAt, ...rest } = req.body;
  const data = { ...rest };

  if (rawExpiresAt !== undefined) {
    let parsedExpiration = null;
    try {
      parsedExpiration = parseExpirationInput(rawExpiresAt);
    } catch (err) {
      return res
        .status(err.status || err.statusCode || 400)
        .json({ message: err.message || "Invalid expiration date" });
    }

    if (parsedExpiration) {
      if (parsedExpiration.getTime() <= Date.now()) {
        return res
          .status(400)
          .json({ message: "Expiration must be in the future" });
      }
      data.expires_at = parsedExpiration.toISOString();
    } else {
      data.expires_at = null;
    }
  }
  const offer = await service.updateOffer(req.params.id, data);

  let tags = null;
  if (rawTags) {
    try {
      tags = typeof rawTags === "string" ? JSON.parse(rawTags) : rawTags;
      if (!Array.isArray(tags)) {
        return res.status(400).json({ message: "Tags must be an array" });
      }
    } catch (e) {
      return res.status(400).json({ message: "Invalid tags format" });
    }
  }
  if (tags) {
    await db("offer_tag_map").where({ offer_id: offer.id }).del();
    if (tags.length) {
      const tagIds = [];
      for (const name of tags) {
        const existingTag = await tagService.findByName(name);
        const tag =
          existingTag ||
          (await tagService.createTag({
            name,
            slug: slugify(name, { lower: true, strict: true }),
          }));
        tagIds.push(tag.id);
      }
      await service.addOfferTags(offer.id, tagIds);
      offer.tags = await service.getOfferTags(offer.id);
    } else {
      offer.tags = [];
    }
  }

  const instructors = await userModel.findInstructors();
  const students = await userModel.findStudents();
  const admins = await userModel.findAdmins();
  const message =
    data.status === "closed"
      ? `Offer closed by ${req.user.full_name} (${req.user.role})`
      : `Offer updated by ${req.user.full_name} (${req.user.role})`;

  let recipients = [];
  if (req.user.role && req.user.role.toLowerCase() === "instructor") {
    recipients = [...students, ...admins];
  } else {
    recipients = [...instructors, ...admins];
  }

  const emailSubject = data.status === "closed" ? "Offer closed" : "Offer updated";

  await Promise.all([
    ...recipients.map((u) =>
      notificationService.createNotification({
        user_id: u.id,
        type: "offer_updated",
        message,
      })
    ),
    ...recipients.map((u) =>
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: u.id,
        message,
      })
    ),
    ...recipients
      .filter((u) => u.email)
      .map((u) =>
        mailService.sendMail({
          to: u.email,
          subject: emailSubject,
          html: `<p>${message}</p>`,
        })
      ),
  ]);


  sendSuccess(res, offer, "Offer updated");
});

exports.deleteOffer = catchAsync(async (req, res) => {
  const offer = await service.getOfferById(req.params.id);
  await service.deleteOffer(req.params.id);

  if (offer && req.user.role && req.user.role.toLowerCase() === "admin") {
    const creator = await userModel.findContactInfo(offer.student_id);
    if (creator) {
      const userMsg = `Your offer "${offer.title}" was deleted by ${req.user.full_name}.`;
      const adminMsg = `You deleted offer "${offer.title}" from ${creator.full_name}.`;

      await Promise.all([
        creator.email
          ? mailService.sendMail({
              to: creator.email,
              subject: "Offer deleted",
              html: `<p>Dear ${creator.full_name},</p><p>Your offer "${offer.title}" has been deleted by admin ${req.user.full_name}.</p>`,
            })
          : Promise.resolve(),
        notificationService.createNotification({
          user_id: creator.id,
          type: "offer_deleted",
          message: userMsg,
        }),
        messageService.createMessage({
          sender_id: req.user.id,
          receiver_id: creator.id,
          message: userMsg,
        }),
        notificationService.createNotification({
          user_id: req.user.id,
          type: "offer_deleted",
          message: adminMsg,
        }),
        messageService.createMessage({
          sender_id: req.user.id,
          receiver_id: req.user.id,
          message: adminMsg,
        }),
      ]);
    }
  } else if (offer && req.user.id === offer.student_id) {
    const admins = await userModel.findAdmins();
    const message = `Offer "${offer.title}" was deleted by ${req.user.full_name}.`;
    await Promise.all([
      ...admins.map((a) =>
        notificationService.createNotification({
          user_id: a.id,
          type: "offer_deleted",
          message,
        })
      ),
      ...admins.map((a) =>
        messageService.createMessage({
          sender_id: req.user.id,
          receiver_id: a.id,
          message,
        })
      ),
      ...admins
        .filter((a) => a.email)
        .map((a) =>
          mailService.sendMail({
            to: a.email,
            subject: "Offer deleted",
            html: `<p>${message}</p>`,
          })
        ),
    ]);
  }

  sendSuccess(res, null, "Offer deleted");
});
