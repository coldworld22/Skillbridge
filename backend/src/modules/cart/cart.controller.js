const logger = require('../../utils/logger.js');
const service = require("./cart.service");
const { sendSuccess } = require("../../utils/response");
const catchAsync = require("../../utils/catchAsync");
const notificationService = require("../notifications/notifications.service");
const userModel = require("../users/user.model");
const { sendCartAddedEmail } = require("../../utils/email");

exports.addItem = catchAsync(async (req, res) => {
  const item = await service.add(req.user.id, req.body);

  const message = `Added ${item.name || "item"} to your cart`;
  await notificationService.createNotification({
    user_id: req.user.id,
    type: "cart_added",
    message,
  });
  try {
    const user = await userModel.findById(req.user.id);
    if (user?.email) await sendCartAddedEmail(user.email, item.name);
  } catch (err) {
    logger.error("Error sending cart added email:", err.message);
  }

  sendSuccess(res, item, "Item added to cart");
});

exports.getItems = catchAsync(async (req, res) => {
  const items = await service.list(req.user.id);
  sendSuccess(res, items);
});

exports.updateItem = catchAsync(async (req, res) => {
  const item = await service.update(req.user.id, req.params.id, req.body.quantity);
  if (!item) return res.status(404).json({ message: "Item not found" });
  sendSuccess(res, item, "Cart updated");
});

exports.removeItem = catchAsync(async (req, res) => {
  const item = await service.remove(req.user.id, req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found" });
  if (item) {
    const message = `Removed ${item.name || "item"} from your cart`;
    await notificationService.createNotification({
      user_id: req.user.id,
      type: "cart_removed",
      message,
    });
  }
  sendSuccess(res, null, "Item removed");
});
