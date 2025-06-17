const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./payouts.service");
const { v4: uuidv4 } = require("uuid");

exports.createPayout = catchAsync(async (req, res) => {
  const { instructor_id, amount, currency, status, notes } = req.body;
  if (!instructor_id || !amount) {
    throw new AppError("Instructor and amount are required", 400);
  }
  const payout = await service.create({
    id: uuidv4(),
    instructor_id,
    amount,
    currency: currency || "USD",
    status: status || "pending",
    notes,
  });
  sendSuccess(res, payout, "Payout request created");
});

exports.getPayouts = catchAsync(async (_req, res) => {
  const data = await service.getAll();
  sendSuccess(res, data);
});

exports.getPayout = catchAsync(async (req, res) => {
  const payout = await service.getById(req.params.id);
  if (!payout) throw new AppError("Payout not found", 404);
  sendSuccess(res, payout);
});

exports.updatePayout = catchAsync(async (req, res) => {
  const payout = await service.update(req.params.id, req.body);
  if (!payout) throw new AppError("Payout not found", 404);
  sendSuccess(res, payout, "Payout updated");
});

exports.deletePayout = catchAsync(async (req, res) => {
  await service.delete(req.params.id);
  sendSuccess(res, null, "Payout deleted");
});
