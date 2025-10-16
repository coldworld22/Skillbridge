const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./paymentMethods.service");
const path = require("path");
const fs = require("fs");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const paypalService = require("../../services/paypalService");

const sanitizeMethod = (method) => {
  if (method?.settings) {
    method.settings.has_client_secret = Boolean(method.settings.client_secret);
    method.settings.has_secret_key = Boolean(method.settings.secret_key);
    method.settings.has_api_secret = Boolean(method.settings.api_secret);
    delete method.settings.client_secret;
    delete method.settings.secret_key;
    delete method.settings.api_secret;
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
  if ((data.type || "").toLowerCase() === "paypal") {
    const envClientId = process.env.PAYPAL_CLIENT_ID;
    const envClientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const envMode = process.env.PAYPAL_MODE;
    data.settings = {
      ...data.settings,
      client_id: data.settings?.client_id || envClientId || null,
      client_secret: data.settings?.client_secret || envClientSecret || null,
      mode: (data.settings?.mode || envMode || "sandbox")?.toLowerCase?.() || "sandbox",
    };
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

function normalizeString(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

exports.updatePayPalCredentials = catchAsync(async (req, res) => {
  const { client_id, client_secret, mode } = req.body || {};

  const normalizedMode = normalizeString(mode);
  if (normalizedMode && !["sandbox", "live"].includes(normalizedMode.toLowerCase())) {
    throw new AppError("Invalid PayPal mode", 400);
  }

  const payload = {};
  const normalizedClientId = normalizeString(client_id);
  if (normalizedClientId) {
    payload.client_id = normalizedClientId;
  }

  const normalizedClientSecret = normalizeString(client_secret);
  if (normalizedClientSecret) {
    payload.client_secret = normalizedClientSecret;
  }

  if (normalizedMode) {
    payload.mode = normalizedMode;
  }

  const savedSettings = await service.updatePayPalSettings(payload);
  paypalService.invalidateClient();

  sendSuccess(
    res,
    {
      client_id: savedSettings?.client_id || null,
      has_client_secret: Boolean(savedSettings?.client_secret),
      mode: savedSettings?.mode || "sandbox",
    },
    "PayPal credentials updated"
  );
});

exports.getStripePublicKey = catchAsync(async (_req, res) => {
  const settings = await service.getStripeSettings();
  sendSuccess(res, { publicKey: settings.publishable_key || null });
});

exports.getStripeCredentials = catchAsync(async (_req, res) => {
  const settings = await service.getStripeSettings();
  sendSuccess(res, {
    publishable_key: settings.publishable_key || null,
    has_secret_key: Boolean(settings.secret_key),
  });
});

exports.updateStripeCredentials = catchAsync(async (req, res) => {
  const { publishable_key, secret_key } = req.body;
  if (!publishable_key || !secret_key) {
    throw new AppError("Publishable and secret keys are required", 400);
  }
  await service.updateStripeSettings({ publishable_key, secret_key });
  sendSuccess(
    res,
    { publishable_key, has_secret_key: true },
    "Stripe credentials updated"
  );
});

exports.getCoinbaseApiKey = catchAsync(async (_req, res) => {
  const settings = await service.getCoinbaseSettings();
  sendSuccess(res, { apiKey: settings.api_key || null });
});

exports.getCoinbaseCredentials = catchAsync(async (_req, res) => {
  const settings = await service.getCoinbaseSettings();
  sendSuccess(res, {
    api_key: settings.api_key || null,
    has_api_secret: Boolean(settings.api_secret),
  });
});

exports.updateCoinbaseCredentials = catchAsync(async (req, res) => {
  const { api_key, api_secret } = req.body;
  if (!api_key || !api_secret) {
    throw new AppError("API key and secret are required", 400);
  }
  await service.updateCoinbaseSettings({ api_key, api_secret });
  sendSuccess(
    res,
    { api_key, has_api_secret: true },
    "Coinbase credentials updated"
  );
});
