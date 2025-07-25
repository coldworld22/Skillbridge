const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./ads.service");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const userModel = require("../users/user.model");

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

  if (!req.file && !req.body.image_url) {
    throw new AppError("Image is required", 400);
  }

  const data = {
    id: uuidv4(),
    title,
    description,
    link_url,
    created_by: req.user.id,
    image_url: req.file ? `/uploads/ads/${req.file.filename}` : req.body.image_url,
  };

  const ad = await service.createAd(data);
  // Notify creator and all admins about the new ad
  await notificationService.createNotification({
    user_id: req.user.id,
    type: "ad_created",
    message: `Ad "${ad.title}" created successfully`,
  });

  const admins = await userModel.findAdmins();
  await Promise.all(
    admins.map((admin) =>
      notificationService.createNotification({
        user_id: admin.id,
        type: "ad_created",
        message: `New ad "${ad.title}" created by ${req.user.id}`,
      })
    )
  );
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
  const { title, description, link_url } = req.body;
  const updates = { title, description, link_url };

  if (title) {
    const existing = await service.findByTitle(title);
    if (existing && existing.id !== req.params.id)
      throw new AppError("Ad title already exists", 409);
  }

  if (req.file) {
    updates.image_url = `/uploads/ads/${req.file.filename}`;
  }

  const updated = await service.updateAd(req.params.id, updates);
  if (!updated) throw new AppError("Ad not found", 404);
  await notificationService.createNotification({
    user_id: updated.created_by,
    type: "ad_updated",
    message: `Your ad "${updated.title}" was updated`,
  });

  const admins = await userModel.findAdmins();
  await Promise.all(
    admins.map((admin) =>
      notificationService.createNotification({
        user_id: admin.id,
        type: "ad_updated",
        message: `Ad "${updated.title}" was updated`,
      })
    )
  );
  sendSuccess(res, updated, "Ad updated");
});

/**
 * Delete an ad by id.
 */
exports.deleteAd = catchAsync(async (req, res) => {
  const ad = await service.getAdById(req.params.id);
  const count = await service.deleteAd(req.params.id);
  if (!count) throw new AppError("Ad not found", 404);
  if (ad) {
    await notificationService.createNotification({
      user_id: ad.created_by,
      type: "ad_deleted",
      message: `Your ad "${ad.title}" was deleted`,
    });
    const admins = await userModel.findAdmins();
    await Promise.all(
      admins.map((admin) =>
        notificationService.createNotification({
          user_id: admin.id,
          type: "ad_deleted",
          message: `Ad "${ad.title}" was deleted`,
        })
      )
    );
  }
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
