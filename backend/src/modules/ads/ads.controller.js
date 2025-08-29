const logger = require('../../utils/logger.js');
const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./ads.service");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const db = require("../../config/database");
const planService = require("../plans/plans.service");
const {
  sendAdSubmissionEmail,
  sendAdApprovalEmail,
  sendNewAdAdminEmail,
} = require("../../utils/email");

// Retrieve the active plan for a user
const getUserPlan = async (userId) => {
  const sub = await db("user_subscriptions")
    .where({ user_id: userId, status: "active" })
    .orderBy("start_date", "desc")
    .first();
  if (!sub) return null;
  return planService.getPlanById(sub.plan_id);
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

  // Retrieve instructor plan and validate limits
  const plan = await getUserPlan(req.user.id);
  if (!plan) throw new AppError("No active plan found", 403);
  const features = plan.features || [];
  const maxAds = Number(
    features.find((f) => f.feature_key === "ads_max_ads")?.value || 0
  );
  const maxDuration = Number(
    features.find((f) => f.feature_key === "ads_max_ad_duration")?.value || 0
  );
  const adCredits = plan.ad_credits;

  if (maxAds) {
    const [{ count }] = await db("ads")
      .where({ created_by: req.user.id })
      .andWhere({ is_active: true })
      .count("id as count");
    if (Number(count) >= maxAds) {
      throw new AppError("Ad limit reached for your plan", 403);
    }
  }

  if (maxDuration && start_at && end_at) {
    const duration = Math.ceil(
      (new Date(end_at) - new Date(start_at)) / (1000 * 60 * 60 * 24)
    );
    if (duration > maxDuration) {
      throw new AppError(
        `Ad duration exceeds plan limit of ${maxDuration} days`,
        400
      );
    }
  }

  if (adCredits !== null && adCredits !== undefined) {
    const [{ count: purchased }] = await db("ads")
      .where({ created_by: req.user.id })
      .whereNotNull("purchased_at")
      .count("id as count");
    if (Number(purchased) >= Number(adCredits)) {
      throw new AppError("No ad credits available", 403);
    }
  }

  const data = {
    id: uuidv4(),
    title,
    description,
    link_url,
    start_at,
    end_at,
    ad_type,
    priority: priority ? Number(priority) : 0,
    allow_branding: allow_branding === "true" || allow_branding === true,
    created_by: req.user.id,
    is_active: false,
    price: price ? Number(price) : 0,
  };

  if (target_roles) {
    try {
      data.target_roles = JSON.parse(target_roles);
    } catch {
      data.target_roles = Array.isArray(target_roles) ? target_roles : [target_roles];
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

  const ad = await service.createAd(data);
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
  const ads = await service.getAds(false, undefined, role, true);
  sendSuccess(res, ads);
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
  const ads = await service.getAds(
    true,
    isAdmin ? undefined : req.user.id,
    role,
    false
  );
  sendSuccess(res, ads);
});

/**
 * Fetch a single ad by id.
 */
exports.getAdById = catchAsync(async (req, res) => {
  const ad = await service.getAdById(req.params.id);
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

  if (target_roles) {
    try {
      updates.target_roles = JSON.parse(target_roles);
    } catch {
      updates.target_roles = Array.isArray(target_roles) ? target_roles : [target_roles];
    }
  }

  if (typeof is_active === "boolean" || is_active === "true" || is_active === "false") {
    updates.is_active = is_active === true || is_active === "true";
  }

  const roles = req.user.roles || [req.user.role];
  const normalizedRoles = roles.map((r) => String(r).toLowerCase());
  const isAdmin =
    normalizedRoles.includes("admin") || normalizedRoles.includes("superadmin");

  let previousAd;
  if (updates.is_active !== undefined) {
    if (!isAdmin) {
      throw new AppError("Only admins can change ad status", 403);
    }
    previousAd = await service.getAdById(req.params.id);
  }

  if (title) {
    const existing = await service.findByTitle(title);
    if (existing && existing.id !== req.params.id)
      throw new AppError("Ad title already exists", 409);
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
  const count = await service.deleteAd(req.params.id);
  if (!count) throw new AppError("Ad not found", 404);

  // Skip sending system-wide notifications when ads are removed

  sendSuccess(res, null, "Ad deleted");
});

/**
 * Purchase an ad.
 */
exports.purchaseAd = catchAsync(async (req, res) => {
  const plan = await getUserPlan(req.user.id);
  if (!plan) throw new AppError("No active plan found", 403);
  const features = plan.features || [];
  const maxAds = Number(
    features.find((f) => f.feature_key === "ads_max_ads")?.value || 0
  );
  const adCredits = plan.ad_credits;
  const [{ count: purchased }] = await db("ads")
    .where({ created_by: req.user.id })
    .whereNotNull("purchased_at")
    .count("id as count");
  if (maxAds && Number(purchased) >= maxAds) {
    throw new AppError("Ad limit reached for your plan", 403);
  }
  if (adCredits !== null && adCredits !== undefined) {
    if (Number(purchased) >= Number(adCredits)) {
      throw new AppError("No ad credits available", 403);
    }
  }
  const ad = await service.purchaseAd(req.params.id, req.user.id);
  if (!ad) throw new AppError("Ad not found or already purchased", 400);
  sendSuccess(res, ad, "Ad purchased");
});

/**
 * Record a view for the specified ad. Authentication is optional; if the
 * request is unauthenticated the view will be stored without a user id.
 */
exports.recordAdView = catchAsync(async (req, res) => {
  const userId = req.user?.id || null;
  await service.recordView(req.params.id, userId);
  sendSuccess(res, null, "View recorded");
});

/**
 * Return basic analytics for an ad.
 */
exports.getAdAnalytics = catchAsync(async (req, res) => {
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
    locationStats: data.location_stats || base.locationStats,
    analytics: data.analytics || base.analytics,
  };
  sendSuccess(res, response);
});

/**
 * Record a click for the given ad.
 */
exports.recordAdClick = catchAsync(async (req, res) => {
  await service.recordClick(req.params.id);
  sendSuccess(res, null, "Click recorded");
});
