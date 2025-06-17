const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./ads.service");

exports.createAd = catchAsync(async (req, res) => {
  const data = { ...req.body, id: uuidv4(), created_by: req.user.id };
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
