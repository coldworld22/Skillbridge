const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./paymentMethods.service");
const path = require("path");
const fs = require("fs");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");

exports.createMethod = catchAsync(async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) throw new AppError("Name and type are required", 400);
  const data = { ...req.body };
  if (req.file) {
    data.icon = `/uploads/payment-methods/${req.file.filename}`;
  }
  const method = await service.create(data);
  sendSuccess(res, method, "Method created");

  const admins = await userModel.findAdmins();
  const senderId = req.user?.id;
  const message = `Payment method "${method.name}" created`;
  await Promise.all(
    admins.map((admin) =>
      Promise.all([
        notificationService.createNotification({
          user_id: admin.id,
          type: "payment_method_created",
          message,
        }),
        messageService.createMessage({
          sender_id: senderId || admin.id,
          receiver_id: admin.id,
          message,
        }),
      ])
    )
  );
});

exports.getMethods = catchAsync(async (_req, res) => {
  const data = await service.getAll();
  sendSuccess(res, data);
});

exports.getActiveMethods = catchAsync(async (_req, res) => {
  const data = await service.getActive();
  sendSuccess(res, data);
});

exports.getMethod = catchAsync(async (req, res) => {
  const method = await service.getById(req.params.id);
  if (!method) throw new AppError("Payment method not found", 404);
  sendSuccess(res, method);
});

exports.updateMethod = catchAsync(async (req, res) => {
  const existing = await service.getById(req.params.id);
  if (!existing) throw new AppError("Payment method not found", 404);

  const data = { ...req.body };
  if (req.file) {
    if (existing.icon) {
      const old = path.join(__dirname, '../../../', existing.icon);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    data.icon = `/uploads/payment-methods/${req.file.filename}`;
  }

  const method = await service.update(req.params.id, data);
  sendSuccess(res, method, "Method updated");

  const admins = await userModel.findAdmins();
  const senderId = req.user?.id;
  const message = `Payment method "${method.name}" updated`;
  await Promise.all(
    admins.map((admin) =>
      Promise.all([
        notificationService.createNotification({
          user_id: admin.id,
          type: "payment_method_updated",
          message,
        }),
        messageService.createMessage({
          sender_id: senderId || admin.id,
          receiver_id: admin.id,
          message,
        }),
      ])
    )
  );
});

exports.deleteMethod = catchAsync(async (req, res) => {
  const existing = await service.getById(req.params.id);
  await service.delete(req.params.id);
  sendSuccess(res, null, "Method deleted");

  const admins = await userModel.findAdmins();
  const senderId = req.user?.id;
  const message = `Payment method "${existing?.name || req.params.id}" deleted`;
  await Promise.all(
    admins.map((admin) =>
      Promise.all([
        notificationService.createNotification({
          user_id: admin.id,
          type: "payment_method_deleted",
          message,
        }),
        messageService.createMessage({
          sender_id: senderId || admin.id,
          receiver_id: admin.id,
          message,
        }),
      ])
    )
  );
});
