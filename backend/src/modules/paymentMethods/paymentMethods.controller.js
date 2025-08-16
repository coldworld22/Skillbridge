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
  if (method.settings) delete method.settings.client_secret;
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
  const sanitized = data.map((m) => {
    if (m.settings) delete m.settings.client_secret;
    return m;
  });
  sendSuccess(res, sanitized);
});

exports.getActiveMethods = catchAsync(async (_req, res) => {
  const data = await service.getActive();
  const sanitized = data.map((m) => {
    if (m.settings) delete m.settings.client_secret;
    return m;
  });
  sendSuccess(res, sanitized);
});

exports.getMethod = catchAsync(async (req, res) => {
  const method = await service.getById(req.params.id);
  if (!method) throw new AppError("Payment method not found", 404);
  if (method.settings) delete method.settings.client_secret;
  sendSuccess(res, method);
});

exports.updateMethod = catchAsync(async (req, res) => {
  const existing = await service.getById(req.params.id);
  if (!existing) throw new AppError("Payment method not found", 404);

  const data = { ...req.body };
  // Merge existing settings with incoming settings to avoid dropping
  // secrets (e.g. client_secret) that are not returned to the client.
  if (data.settings) {
    let incoming = data.settings;
    // If settings came in as a JSON string (e.g. multipart requests), parse it
    if (typeof incoming === "string") {
      try {
        incoming = JSON.parse(incoming);
      } catch (_err) {
        incoming = {};
      }
    }
    data.settings = { ...(existing.settings || {}), ...(incoming || {}) };
  }
  if (req.file) {
    if (existing.icon) {
      const old = path.join(__dirname, '../../../', existing.icon);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    data.icon = `/uploads/payment-methods/${req.file.filename}`;
  }

  const method = await service.update(req.params.id, data);
  if (method.settings) delete method.settings.client_secret;
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

exports.getPayPalClientId = catchAsync(async (_req, res) => {
  const clientId = await service.getPayPalClientId();
  sendSuccess(res, { clientId });
});

exports.getPayPalCredentials = catchAsync(async (_req, res) => {
  const settings = await service.getPayPalSettings();
  sendSuccess(res, { client_id: settings.client_id || null });
});

exports.updatePayPalCredentials = catchAsync(async (req, res) => {
  const { client_id, client_secret } = req.body;
  if (!client_id || !client_secret) {
    throw new AppError("Client ID and secret are required", 400);
  }
  await service.updatePayPalSettings({ client_id, client_secret });
  sendSuccess(res, { client_id }, "PayPal credentials updated");
});
