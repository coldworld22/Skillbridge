const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./paymentMethods.service");
const path = require("path");
const fs = require("fs");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");

const sanitizeMethod = (method) => {
  if (method?.settings) {
    method.settings.has_client_secret = Boolean(method.settings.client_secret);
    delete method.settings.client_secret;
  }
  return method;
};

exports.createMethod = catchAsync(async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) throw new AppError("Name and type are required", 400);
  const data = { ...req.body };
  if (data.settings) {
    let settings = data.settings;
    if (typeof settings === "string") {
      try {
        settings = JSON.parse(settings);
      } catch (_err) {
        settings = {};
      }
    }
    delete settings.has_client_secret;
    data.settings = settings;
  }
  if (req.file) {
    data.icon = `/uploads/payment-methods/${req.file.filename}`;
  }
  const method = sanitizeMethod(await service.create(data));
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
  sendSuccess(res, data.map(sanitizeMethod));
});

exports.getActiveMethods = catchAsync(async (_req, res) => {
  const data = await service.getActive();
  sendSuccess(res, data.map(sanitizeMethod));
});

exports.getMethod = catchAsync(async (req, res) => {
  const method = await service.getById(req.params.id);
  if (!method) throw new AppError("Payment method not found", 404);
  sendSuccess(res, sanitizeMethod(method));
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
    if (incoming && typeof incoming === "object") {
      delete incoming.has_client_secret;
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

  const method = sanitizeMethod(await service.update(req.params.id, data));
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
  sendSuccess(res, {
    client_id: settings.client_id || null,
    has_client_secret: Boolean(settings.client_secret),
    mode: settings.mode,
  });
});

exports.updatePayPalCredentials = catchAsync(async (req, res) => {
  const { client_id, client_secret, mode } = req.body;
  if (!client_id || !client_secret) {
    throw new AppError("Client ID and secret are required", 400);
  }
  if (mode && !["sandbox", "live"].includes(mode)) {
    throw new AppError("Invalid PayPal mode", 400);
  }
  await service.updatePayPalSettings({ client_id, client_secret, mode });
  sendSuccess(
    res,
    { client_id, has_client_secret: true, mode: mode || "sandbox" },
    "PayPal credentials updated"
  );
});
