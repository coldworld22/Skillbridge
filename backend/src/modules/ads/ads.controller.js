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
