const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./ads.service");

/**
 * Controller functions for managing advertisement banners.
 */

/**
 * Create a new advertisement.
 */
exports.createAd = catchAsync(async (req, res) => {
  const { title, description, link_url } = req.body;

  if (await service.findByTitle(title)) {
    throw new AppError("Ad title already exists", 409);
  }

  if (!req.files?.image?.[0] &&
      !req.files?.video?.[0] &&
      !req.body.image_url &&
      !req.body.video_url) {
    throw new AppError("Image or video is required", 400);
  }

  const data = {
    id: uuidv4(),
    title,
    description,
    link_url,
    created_by: req.user.id,
    is_active: false,
  };

  if (req.files?.image?.[0]) {
    data.image_url = `/uploads/ads/${req.files.image[0].filename}`;
  } else if (req.files?.video?.[0]) {
    data.video_url = `/uploads/ads/${req.files.video[0].filename}`;
  }

  if (req.body.image_url) data.image_url = req.body.image_url;
  if (req.body.video_url) data.video_url = req.body.video_url;

  const ad = await service.createAd(data);

  // Notifications and messages to all users were removed to simplify ad creation
  // and avoid spamming the platform with global alerts.

  sendSuccess(res, ad, "Ad created");
});

/**
 * List all ads ordered by creation date.
 */
exports.getAds = catchAsync(async (_req, res) => {
  const ads = await service.getAds();
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
  const { title, description, link_url, is_active } = req.body;
  const updates = { title, description, link_url };

  if (typeof is_active === "boolean") {
    updates.is_active = is_active;
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
  if (req.body.image_url) updates.image_url = req.body.image_url;
  if (req.body.video_url) updates.video_url = req.body.video_url;

  const updated = await service.updateAd(req.params.id, updates);
  if (!updated) throw new AppError("Ad not found", 404);

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
  };
  sendSuccess(res, response);
});
