const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./payouts.service");
const { v4: uuidv4 } = require("uuid");
const walletService = require("./wallet.service");

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
  const existing = await service.getById(req.params.id);
  if (!existing) throw new AppError("Payout not found", 404);

  const updateData = { ...req.body };
  if (req.body.status === "approved" && existing.status !== "approved") {
    const wallet = await walletService.getByInstructor(existing.instructor_id);
    const balance = wallet ? Number(wallet.balance) : 0;
    if (balance < Number(existing.amount)) {
      throw new AppError("Insufficient wallet balance", 400);
    }
    await walletService.decrement(existing.instructor_id, existing.amount);
    updateData.processed_at = new Date();
  }
  const payout = await service.update(req.params.id, updateData);
  sendSuccess(res, payout, "Payout updated");
});

exports.deletePayout = catchAsync(async (req, res) => {
  await service.delete(req.params.id);
  sendSuccess(res, null, "Payout deleted");
});
