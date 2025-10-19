const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./paymentConfig.service");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");

exports.getSettings = catchAsync(async (_req, res) => {
  const settings = await service.getSettings();
  sendSuccess(res, settings || {});
});

exports.updateSettings = catchAsync(async (req, res) => {
  const { platformCut } = req.body;
  if (platformCut) {
    for (const val of Object.values(platformCut)) {
      if (typeof val !== "number" || isNaN(val) || val < 0 || val > 100) {
        return res
          .status(400)
          .json({ error: "Platform cut values must be numbers between 0 and 100" });
      }
    }
  }

  const payload = { ...req.body };
  if (payload.minimumPayoutAmount !== undefined) {
    const parsed = Number(payload.minimumPayoutAmount);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return res
        .status(400)
        .json({ error: "Minimum payout amount must be zero or greater" });
    }
    payload.minimumPayoutAmount = parsed;
    payload.minimumWithdrawalAmount = parsed;
  } else if (payload.minimumWithdrawalAmount !== undefined) {
    const parsed = Number(payload.minimumWithdrawalAmount);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return res
        .status(400)
        .json({ error: "Minimum payout amount must be zero or greater" });
    }
    payload.minimumWithdrawalAmount = parsed;
    payload.minimumPayoutAmount = parsed;
  }

  const settings = await service.updateSettings(payload);
  sendSuccess(res, settings, "Settings updated");

  const admins = await userModel.findAdmins();
  const senderId = req.user?.id;
  await Promise.all(
    admins.map((admin) =>
      Promise.all([
        notificationService.createNotification({
          user_id: admin.id,
          type: "payment_config_updated",
          message: "Payment configuration updated",
        }),
        messageService.createMessage({
          sender_id: senderId || admin.id,
          receiver_id: admin.id,
          message: "Payment configuration updated",
        }),
      ])
    )
  );
});
