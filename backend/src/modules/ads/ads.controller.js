const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./ads.service");

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
  sendSuccess(res, ad, "Ad created");
});

exports.getAds = catchAsync(async (_req, res) => {
  const ads = await service.getAds();
  sendSuccess(res, ads);
});

exports.getAdById = catchAsync(async (req, res) => {
  const ad = await service.getAdById(req.params.id);
  sendSuccess(res, ad);
});

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
  sendSuccess(res, updated, "Ad updated");
});

exports.deleteAd = catchAsync(async (req, res) => {
  const count = await service.deleteAd(req.params.id);
  if (!count) throw new AppError("Ad not found", 404);
  sendSuccess(res, null, "Ad deleted");
});

exports.getAdAnalytics = catchAsync(async (req, res) => {
  const data = await service.getAdAnalytics(req.params.id);
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
