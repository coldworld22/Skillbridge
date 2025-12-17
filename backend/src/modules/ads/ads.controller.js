const logger = require('../../utils/logger.js');
const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./ads.service");
const planService = require("../plans/plans.service");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const { isAdminRole } = require("../../utils/role");
const {
  sendAdSubmissionEmail,
  sendAdApprovalEmail,
  sendNewAdAdminEmail,
} = require("../../utils/email");
const db = require("../../config/database");
const { resolveAdPlanFeatures, normalizePlanKey } = require("./ads.utils");
const { getActiveInstructorPlan } = require("../plans/instructor.helper");
const {
  getActiveSubscriptionForPlan,
} = require("../plans/subscription.helper");

const ALLOWED_INSTRUCTOR_AD_PLAN_KEYS = new Set([
  "basic",
  "basic-plan",
  "regular",
  "regular-plan",
  "prime",
  "prime-plan",
  "instructor-basic",
  "instructor-regular",
  "instructor-prime",
  "instructor-pro",
]);

const numericOrNull = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const resolveInstructorPlanForAds = async (user) => {
  let planId =
    user.plan_id || user.plan?.id || user.subscription?.plan_id;

  let plan = planId ? await planService.getPlanById(planId) : null;
  let subscriptionId =
    user.subscription?.id || user.subscription_id || null;

  if (!plan) {
    const active = await getActiveInstructorPlan(user.id);
    if (active?.id) {
      plan = await planService.getPlanById(active.id);
      subscriptionId = active.subscription_id || subscriptionId;
      if (!planId) {
        planId = active.id;
      }
    }
  }

  if (!plan) {
    throw new AppError(
      "You need an active instructor plan before you can manage ads",
      403
    );
  }

  const planKey = normalizePlanKey(plan);
  if (planKey && !ALLOWED_INSTRUCTOR_AD_PLAN_KEYS.has(planKey)) {
    throw new AppError(
      "Your current subscription does not include instructor ad tools",
      403
    );
  }

  if (!Array.isArray(plan.features)) {
    plan.features = [];
  }

  if (!subscriptionId) {
    const activeSub = await getActiveSubscriptionForPlan(user.id, plan.id);
    subscriptionId = activeSub?.subscription_id || null;
  }

  if (subscriptionId) {
    plan.active_subscription_id = subscriptionId;
  }

  return plan;
};

/**
 * Controller functions for managing advertisement banners.
 */

/**
 * Create a new advertisement.
 */
exports.createAd = catchAsync(async (req, res) => {
  const {
    title: rawTitle,
    description,
    link_url,
    start_at,
    end_at,
    target_roles,
    ad_type,
    priority,
    allow_branding,
    price,
  } = req.body;

  const title = rawTitle?.trim();

  if (await service.findByTitle(title)) {
    throw new AppError("Ad title already exists", 409);
  }

  if (!req.files?.image?.[0] &&
      !req.files?.video?.[0] &&
      !req.body.image_url &&
      !req.body.video_url) {
    throw new AppError("Image or video is required", 400);
  }

  const isAdmin = isAdminRole(req.user.roles || req.user.role);
  const defaultDuration =
    Number(process.env.DEFAULT_AD_DURATION_DAYS) || 0;
  let start = start_at ? new Date(start_at) : new Date();
  let end;
  if (end_at) {
    end = new Date(end_at);
  } else if (defaultDuration > 0) {
    end = new Date(
      start.getTime() + defaultDuration * 24 * 60 * 60 * 1000
    );
  } else {
    end = null;
  }
  if (start && end && end.getTime() < start.getTime()) {
    throw new AppError(
      "end_at must be greater than or equal to start_at",
      400
    );
  }

  const data = {
    id: uuidv4(),
    title,
    description,
    link_url,
    start_at: start,
    end_at: end,
    ad_type,
    priority: priority ? Number(priority) : 0,
    allow_branding: allow_branding === "true" || allow_branding === true,
    created_by: req.user.id,
    is_active: isAdmin,
    price: price ? Number(price) : 0,
  };

  if (isAdmin) {
    // Admin ads are visible to all roles regardless of provided target_roles
    data.target_roles = null;
  } else {
    if (!target_roles) {
      throw new AppError("target_roles are required for instructors", 400);
    }
    try {
      data.target_roles = JSON.parse(target_roles);
    } catch {
      data.target_roles = Array.isArray(target_roles)
        ? target_roles
        : [target_roles];
    }
    if (!data.target_roles || data.target_roles.length === 0) {
      throw new AppError("At least one target role required", 400);
    }
  }

  if (req.files?.image?.[0]) {
    data.image_url = `/uploads/ads/${req.files.image[0].filename}`;
    data.video_url = null;
  } else if (req.files?.video?.[0]) {
    data.video_url = `/uploads/ads/${req.files.video[0].filename}`;
    data.image_url = null;
  }

  if (req.body.image_url) {
    data.image_url = req.body.image_url;
    data.video_url = null;
  } else if (req.body.video_url) {
    data.video_url = req.body.video_url;
    data.image_url = null;
  }

  let ad;
  if (!isAdmin) {
    const plan = await resolveInstructorPlanForAds(req.user);
    const features = resolveAdPlanFeatures(plan);

    const maxDuration = numericOrNull(features["ads_max_duration"]);
    if (maxDuration !== null) {
      if (maxDuration <= 0) {
        throw new AppError("Ad duration exceeds limit for your plan", 403);
      }
      if (!end) {
        end = new Date(
          start.getTime() + maxDuration * 24 * 60 * 60 * 1000
        );
      } else {
        const diffDays = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays > maxDuration) {
          throw new AppError("Ad duration exceeds limit for your plan", 403);
        }
      }
    }
    data.start_at = start;
    data.end_at = end;

    const maxAds = numericOrNull(features["ads_max_ads"]);
    if (maxAds !== null) {
      if (maxAds <= 0) {
        throw new AppError("Ad limit reached for your plan", 403);
      }
      const { data: existing } = await service.getAds(
        true,
        req.user.id,
        undefined,
        false,
        true,
        undefined,
        undefined,
        "active",
        undefined,
        undefined
      );
      if (existing.length >= maxAds) {
        throw new AppError("Ad limit reached for your plan", 403);
      }
    }

    const brandingAllowed = !!features["ads_allow_branding"];
    if (data.allow_branding && !brandingAllowed) {
      throw new AppError("Branding not allowed for your plan", 403);
    }

    const allowance = plan.ad_credits;
    const remainingCredits = await planService.getRemainingAdCredits(
      plan,
      req.user.id
    );
    let activeSubscriptionId =
      plan.active_subscription_id ||
      (await getActiveSubscriptionForPlan(req.user.id, plan.id))
        ?.subscription_id ||
      null;
    if (
      allowance !== null &&
      allowance !== undefined &&
      !activeSubscriptionId
    ) {
      throw new AppError(
        "An active subscription is required to use ad credits",
        403
      );
    }
    plan.active_subscription_id = activeSubscriptionId;
    if (remainingCredits !== null && remainingCredits <= 0) {
      throw new AppError("Insufficient ad credits", 403);
    }

    const trx = await db.transaction();
    try {
      ad = await service.createAd(data, trx);
      if (allowance !== null && allowance !== undefined) {
        const result = await planService.consumeAdCredit({
          planId: plan.id,
          userId: req.user.id,
          allowance,
          subscriptionId: plan.active_subscription_id,
          trx,
        });
        if (!result.consumed) {
          throw new AppError("Insufficient ad credits", 403);
        }
      }
      await trx.commit();
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  } else {
    ad = await service.createAd(data);
  }

  try {
    if (req.user?.email) {
      await sendAdSubmissionEmail(
        req.user.email,
        req.user.full_name,
        ad.title
      );
    }
    const admins = await userModel.findAdmins();
    const notificationMessage = `New ad created: ${ad.title}`;
    await Promise.all(
      admins.map((admin) =>
        Promise.all([
          sendNewAdAdminEmail(
            admin.email,
            req.user.full_name || "Instructor",
            ad.title
          ),
          notificationService.createNotification({
            user_id: admin.id,
            type: "ad",
            message: notificationMessage,
          }),
          messageService.createMessage({
            sender_id: req.user.id,
            receiver_id: admin.id,
            message: notificationMessage,
          }),
        ])
      )
    );
  } catch (err) {
    logger.error("Error sending ad creation emails:", err);
  }

  sendSuccess(res, ad, "Ad created");
});

/**
 * Check if a given ad title already exists.
 */
exports.checkTitle = catchAsync(async (req, res) => {
  const title = req.query.title?.trim();
  if (!title) {
    sendSuccess(res, { exists: false });
    return;
  }
  const existing = await service.findByTitle(title);
  sendSuccess(res, { exists: !!existing });
});

/**
 * Public endpoint: list only active ads.
 */
exports.getAds = catchAsync(async (req, res) => {
  const role = req.query.role?.toLowerCase();
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const offset = req.query.offset ? Number(req.query.offset) : undefined;
  const status = req.query.status ? String(req.query.status).toLowerCase() : undefined;
  const type = req.query.type ? String(req.query.type).toLowerCase() : undefined;
  const search = req.query.search;
  const result = await service.getAds(
    false,
    undefined,
    role,
    false,
    false,
    limit,
    offset,
    status,
    type,
    search
  );
  sendSuccess(res, result.data, undefined, result.meta);
});

/**
 * Admin/Instructor endpoint: list ads including inactive ones.
 *
 * - Admins receive all ads (optionally filtered by the `role` query).
 * - Instructors receive only the ads they created, also supporting the `role` filter.
 */
exports.getAllAds = catchAsync(async (req, res) => {
  const roles = req.user.roles || [req.user.role];
  const normalized = roles.map((r) => String(r).toLowerCase());
  const isAdmin =
    normalized.includes("admin") || normalized.includes("superadmin");
  const role = req.query.role?.toLowerCase();
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const offset = req.query.offset ? Number(req.query.offset) : undefined;
  const status = req.query.status ? String(req.query.status).toLowerCase() : undefined;
  const type = req.query.type ? String(req.query.type).toLowerCase() : undefined;
  const search = req.query.search;
  const result = await service.getAds(
    true,
    isAdmin ? undefined : req.user.id,
    role,
    false,
    true,
    limit,
    offset,
    status,
    type,
    search
  );
  sendSuccess(res, result.data, undefined, result.meta);
});

/**
 * Fetch a single ad by id.
 */
exports.getAdById = catchAsync(async (req, res) => {
  const ad = await service.getAdById(req.params.id);
  sendSuccess(res, ad);
});

/**
 * Public: Fetch a single ad by id with only public fields.
 */
exports.getPublicAd = catchAsync(async (req, res) => {
  const ad = await service.getPublicAdById(req.params.id);
  if (!ad) {
    throw new AppError("Ad not found", 404);
  }
  sendSuccess(res, ad);
});

/**
 * Update an existing ad.
 */
exports.updateAd = catchAsync(async (req, res) => {
  const {
    title: rawTitle,
    description,
    link_url,
    is_active,
    start_at,
    end_at,
    target_roles,
    ad_type,
    priority,
    allow_branding,
    price,
  } = req.body;
  const title = rawTitle?.trim();
  const updates = {
    title,
    description,
    link_url,
    start_at,
    end_at,
    ad_type,
    priority: priority ? Number(priority) : undefined,
    allow_branding: allow_branding === "true" || allow_branding === true,
    price: price ? Number(price) : undefined,
  };

  let parsedTargetRoles;
  if (target_roles) {
    try {
      parsedTargetRoles = JSON.parse(target_roles);
    } catch {
      parsedTargetRoles = Array.isArray(target_roles)
        ? target_roles
        : [target_roles];
    }
  }

  if (typeof is_active === "boolean" || is_active === "true" || is_active === "false") {
    updates.is_active = is_active === true || is_active === "true";
  }

  const roles = req.user.roles || [req.user.role];
  const isAdmin = isAdminRole(roles);
  const ad = await service.getAdById(req.params.id);
  if (!ad) throw new AppError("Ad not found", 404);
  if (!isAdmin && ad.created_by !== req.user.id) {
    throw new AppError("Forbidden", 403);
  }
  if (updates.is_active !== undefined && !isAdmin) {
    throw new AppError("Only admins can change ad status", 403);
  }
  const previousAd = ad;

  const newStart = start_at ?? ad.start_at;
  const newEnd = end_at ?? ad.end_at;
  if (
    newStart &&
    newEnd &&
    new Date(newEnd).getTime() < new Date(newStart).getTime()
  ) {
    throw new AppError(
      "end_at must be greater than or equal to start_at",
      400
    );
  }

  if (title) {
    const existing = await service.findByTitle(title);
    if (existing && existing.id !== req.params.id)
      throw new AppError("Ad title already exists", 409);
  }

  if (isAdmin) {
    // Admin ads remain visible to all roles
    updates.target_roles = null;
  } else if (parsedTargetRoles) {
    updates.target_roles = parsedTargetRoles;
  }

  if (req.files?.image?.[0]) {
    updates.image_url = `/uploads/ads/${req.files.image[0].filename}`;
    updates.video_url = null;
  } else if (req.files?.video?.[0]) {
    updates.video_url = `/uploads/ads/${req.files.video[0].filename}`;
    updates.image_url = null;
  }
  if (req.body.image_url) {
    updates.image_url = req.body.image_url;
    updates.video_url = null;
  } else if (req.body.video_url) {
    updates.video_url = req.body.video_url;
    updates.image_url = null;
  }

  if (!isAdmin) {
    // Load instructor plan and enforce ad feature limits
    const plan = await resolveInstructorPlanForAds(req.user);
    const features = resolveAdPlanFeatures(plan);

    const maxDuration = numericOrNull(features["ads_max_duration"]);
    if (
      maxDuration !== null &&
      maxDuration > 0 &&
      newStart &&
      newEnd
    ) {
      const diffDays = Math.ceil(
        (new Date(newEnd).getTime() - new Date(newStart).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (diffDays > maxDuration) {
        throw new AppError("Ad duration exceeds limit for your plan", 403);
      }
    } else if (maxDuration !== null && maxDuration <= 0) {
      throw new AppError("Ad duration exceeds limit for your plan", 403);
    }

    const maxAds = numericOrNull(features["ads_max_ads"]);
    if (maxAds !== null) {
      if (maxAds <= 0) {
        throw new AppError("Ad limit reached for your plan", 403);
      }
      const { data: existing } = await service.getAds(
        true,
        req.user.id,
        undefined,
        false,
        true,
        undefined,
        undefined,
        "active",
        undefined,
        undefined
      );
      const activeBeyondCurrent = existing.filter(
        (item) => item.id !== ad.id
      );
      if (activeBeyondCurrent.length >= maxAds) {
        throw new AppError("Ad limit reached for your plan", 403);
      }
    }

    const brandingAllowed = !!features["ads_allow_branding"];
    const newBranding =
      updates.allow_branding !== undefined
        ? updates.allow_branding
        : ad.allow_branding;
    if (newBranding && !brandingAllowed) {
      throw new AppError("Branding not allowed for your plan", 403);
    }
  }

  const updated = await service.updateAd(req.params.id, updates);
  if (!updated) throw new AppError("Ad not found", 404);

  if (
    updates.is_active === true &&
    previousAd &&
    previousAd.is_active === false &&
    updated.created_by
  ) {
    try {
      const creator = await userModel.findById(updated.created_by);
      if (creator?.email) {
        await sendAdApprovalEmail(creator.email, updated.title);
      }
    } catch (err) {
      logger.error("Error sending ad approval email:", err);
    }
  }

  // Global notifications/messages removed

  sendSuccess(res, updated, "Ad updated");
});

/**
 * Delete an ad by id.
 */
exports.deleteAd = catchAsync(async (req, res) => {
  const roles = req.user.roles || [req.user.role];
  const normalizedRoles = roles.map((r) => String(r).toLowerCase());
  const isAdmin =
    normalizedRoles.includes("admin") || normalizedRoles.includes("superadmin");

  const ad = await service.getAdById(req.params.id);
  if (!ad) throw new AppError("Ad not found", 404);
  if (!isAdmin && ad.created_by !== req.user.id) {
    throw new AppError("Forbidden", 403);
  }

  const count = await service.deleteAd(req.params.id);
  if (!count) throw new AppError("Ad not found", 404);

  // Skip sending system-wide notifications when ads are removed

  sendSuccess(res, null, "Ad deleted");
});

/**
 * Purchase an ad.
 */
exports.purchaseAd = catchAsync(async (req, res) => {
  const roles = req.user.roles || [req.user.role];
  const normalizedRoles = roles.map((r) => String(r).toLowerCase());
  const isAdmin =
    normalizedRoles.includes("admin") || normalizedRoles.includes("superadmin");

  const ad = await service.getAdById(req.params.id);
  if (!ad) throw new AppError("Ad not found", 404);
  if (!isAdmin && ad.created_by !== req.user.id) {
    throw new AppError("Forbidden", 403);
  }

  const purchased = await service.purchaseAd(req.params.id, req.user.id);
  if (!purchased) throw new AppError("Ad not found or already purchased", 400);
  sendSuccess(res, purchased, "Ad purchased");
});

/**
 * Record a view for the specified ad. Authentication is optional; if the
 * request is unauthenticated the view will be stored without a user id.
 */
exports.recordAdView = catchAsync(async (req, res) => {
  const ad = await service.getAdById(req.params.id);
  if (!ad) {
    throw new AppError("Ad not found", 404);
  }
  if (!ad.is_active) {
    throw new AppError("Ad is inactive", 403);
  }
  const now = Date.now();
  if (
    (ad.start_at && new Date(ad.start_at).getTime() > now) ||
    (ad.end_at && new Date(ad.end_at).getTime() < now)
  ) {
    throw new AppError("Ad is outside its active window", 403);
  }
  const userId = req.user?.id || null;
  const viewerIp = req.ip;
  const userAgent = req.get("user-agent");
  await service.recordView(ad.id, userId, viewerIp, userAgent);
  sendSuccess(res, null, "View recorded");
});

/**
 * Return basic analytics for an ad.
 */
exports.getAdAnalytics = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const isAdmin = isAdminRole(req.user.roles || req.user.role);

  // Fetch the ad and verify ownership when the requester is not an admin
  const ad = await service.getAdById(req.params.id);
  if (!ad) {
    throw new AppError("Ad not found", 404);
  }
  if (!isAdmin && ad.created_by !== req.user.id) {
    throw new AppError("Forbidden", 403);
  }

  if (!isAdmin) {
    const plan = await resolveInstructorPlanForAds(req.user);
    const features = resolveAdPlanFeatures(plan);
    if (!features["ads_show_analytics"]) {
      throw new AppError(
        "Analytics not available for your current plan",
        403
      );
    }
  }

  const data = await service.getAdAnalytics(req.params.id);
  /**
   * Default analytics values used when no data exists
   */
  const base = {
    views: 0,
    ctr: 0,
    conversions: 0,
    reach: 0,
    devices: [],
    ipStats: [],
    locationStats: [],
    analytics: [],
  };
  if (!data) {
    sendSuccess(res, base);
    return;
  }
  const response = {
    ...base,
    views: data.views,
    ctr: data.ctr,
    conversions: data.clicks,
    reach: data.unique_viewers,
    // Include any additional analytics information if present on the record.
    devices: data.devices || base.devices,
    ipStats: data.ip_stats || base.ipStats,
    locationStats: data.location_stats || base.locationStats,
    analytics: data.analytics || base.analytics,
  };
  sendSuccess(res, response);
});

/**
 * Record a click for the given ad.
 */
exports.recordAdClick = catchAsync(async (req, res) => {
  const ad = await service.getAdById(req.params.id);
  if (!ad) {
    throw new AppError("Ad not found", 404);
  }
  if (!ad.is_active) {
    throw new AppError("Ad is inactive", 403);
  }
  const now = Date.now();
  if (
    (ad.start_at && new Date(ad.start_at).getTime() > now) ||
    (ad.end_at && new Date(ad.end_at).getTime() < now)
  ) {
    throw new AppError("Ad is outside its active window", 403);
  }
  await service.recordClick(ad.id);
  sendSuccess(res, null, "Click recorded");
});
