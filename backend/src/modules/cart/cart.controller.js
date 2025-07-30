const service = require("./cart.service");
const { sendSuccess } = require("../../utils/response");
const catchAsync = require("../../utils/catchAsync");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const userModel = require("../users/user.model");

exports.addItem = catchAsync(async (req, res) => {
  const item = service.add(req.user.id, req.body);

  const message = `Added ${item.name || "item"} to your cart`;
  await notificationService.createNotification({
    user_id: req.user.id,
    type: "cart_added",
    message,
  });
  const admins = await userModel.findAdmins();
  const sender = admins[0];
  if (sender) {
    await messageService.createMessage({
      sender_id: sender.id,
      receiver_id: req.user.id,
      message,
    });
  }

  sendSuccess(res, item, "Item added to cart");
});

exports.getItems = catchAsync(async (req, res) => {
  const items = service.list(req.user.id);
  sendSuccess(res, items);
});

exports.updateItem = catchAsync(async (req, res) => {
  const item = service.update(req.user.id, req.params.id, req.body.quantity);
  if (!item) return res.status(404).json({ message: "Item not found" });
  sendSuccess(res, item, "Cart updated");
});

exports.removeItem = catchAsync(async (req, res) => {
  const item = service.remove(req.user.id, req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found" });
  sendSuccess(res, null, "Item removed");
});
