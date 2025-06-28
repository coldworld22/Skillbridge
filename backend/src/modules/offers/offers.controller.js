const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./offers.service");

exports.createOffer = catchAsync(async (req, res) => {
  const { title, description, budget, timeframe } = req.body;
  const data = {
    id: uuidv4(),
    student_id: req.user.id,
    title,
    description,
    budget,
    timeframe,
    status: "open",
  };
  const offer = await service.createOffer(data);
  sendSuccess(res, offer, "Offer created");
});

exports.getOffers = catchAsync(async (_req, res) => {
  const offers = await service.getOffers();
  sendSuccess(res, offers);
});

exports.getOfferById = catchAsync(async (req, res) => {
  const offer = await service.getOfferById(req.params.id);
  sendSuccess(res, offer);
});

exports.updateOffer = catchAsync(async (req, res) => {
  const offer = await service.updateOffer(req.params.id, req.body);
  sendSuccess(res, offer, "Offer updated");
});

exports.deleteOffer = catchAsync(async (req, res) => {
  await service.deleteOffer(req.params.id);
  sendSuccess(res, null, "Offer deleted");
});
