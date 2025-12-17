/**
 * Controller for currency management. Handles CRUD operations and notifies
 * administrators when currency data changes.
 */
const service = require('./currencies.service');
const catchAsync = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/response');
const AppError = require('../../utils/AppError');
const path = require('path');
const fs = require('fs');
const userModel = require('../users/user.model');
const notificationService = require('../notifications/notifications.service');
const messageService = require('../messages/messages.service');
const messages = require('../../utils/messages');

/**
 * Create a new currency.
 * Expects label, code and symbol in the request body.
 * Notifies all admins on success.
 */
exports.createCurrency = catchAsync(async (req, res) => {
  const { label, code, symbol, exchange_rate, tax_rate } = req.body;
  if (!label || !code || !symbol)
    throw new AppError(messages.CURRENCY.FIELDS_REQUIRED, 400);
  if (exchange_rate && isNaN(Number(exchange_rate))) {
    throw new AppError(messages.CURRENCY.INVALID_EXCHANGE_RATE, 400);
  }
  if (tax_rate && isNaN(Number(tax_rate))) {
    throw new AppError(messages.CURRENCY.INVALID_TAX_RATE, 400);
  }

  const data = { ...req.body };
  if (req.file) {
    data.logo_url = `/uploads/currencies/${req.file.filename}`;
  }
  // Coerce numeric and boolean values from multipart/form-data
  if (data.exchange_rate) data.exchange_rate = Number(data.exchange_rate);
  if (data.tax_rate) data.tax_rate = Number(data.tax_rate);
  ['is_active', 'is_default', 'auto_update'].forEach((k) => {
    if (data[k] !== undefined) data[k] = data[k] === 'true' || data[k] === true;
  });

  try {
    const currency = await service.create(data);
    sendSuccess(res, currency, messages.CURRENCY.CREATED);
    const admins = await userModel.findAdmins();
    const senderId = req.user?.id;
    await Promise.all(
      admins.map((admin) =>
        Promise.all([
          notificationService.createNotification({
            user_id: admin.id,
            type: 'currency_created',
            message: messages.CURRENCY.CREATED_NOTIFICATION(currency.label),
          }),
          messageService.createMessage({
            sender_id: senderId || admin.id,
            receiver_id: admin.id,
            message: messages.CURRENCY.CREATED_NOTIFICATION(currency.label),
          }),
        ])
      )
    );
  } catch (err) {
    if (err.code === '23505') {
      // duplicate currency code
      return res
        .status(400)
        .json({ message: messages.CURRENCY.CODE_EXISTS });
    }
    throw err;
  }
});

exports.listCurrencies = catchAsync(async (_req, res) => {
  const list = await service.list();
  sendSuccess(res, list);
});

/**
 * Update an existing currency by ID.
 * Validates input and notifies administrators when changes occur.
 */
exports.updateCurrency = catchAsync(async (req, res) => {
  const existing = await service.getById(req.params.id);
  if (!existing) throw new AppError(messages.CURRENCY.NOT_FOUND, 404);

  const { label, code, symbol, exchange_rate, tax_rate } = req.body;
  if (label !== undefined && !label) {
    throw new AppError(messages.CURRENCY.LABEL_REQUIRED, 400);
  }
  if (code !== undefined && !code) {
    throw new AppError(messages.CURRENCY.CODE_REQUIRED, 400);
  }
  if (symbol !== undefined && !symbol) {
    throw new AppError(messages.CURRENCY.SYMBOL_REQUIRED, 400);
  }
  if (exchange_rate && isNaN(Number(exchange_rate))) {
    throw new AppError(messages.CURRENCY.INVALID_EXCHANGE_RATE, 400);
  }
  if (tax_rate && isNaN(Number(tax_rate))) {
    throw new AppError(messages.CURRENCY.INVALID_TAX_RATE, 400);
  }

  const data = { ...req.body };
  if (req.file) {
    if (existing.logo_url) {
      const old = path.join(__dirname, '../../../', existing.logo_url);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    data.logo_url = `/uploads/currencies/${req.file.filename}`;
  }

  if (data.exchange_rate) data.exchange_rate = Number(data.exchange_rate);
  if (data.tax_rate) data.tax_rate = Number(data.tax_rate);
  ['is_active', 'is_default', 'auto_update'].forEach((k) => {
    if (data[k] !== undefined) data[k] = data[k] === 'true' || data[k] === true;
  });

  try {
    const updated = await service.update(req.params.id, data);
    sendSuccess(res, updated, messages.CURRENCY.UPDATED);
    const admins = await userModel.findAdmins();
    const senderId = req.user?.id;
    await Promise.all(
      admins.map((admin) =>
        Promise.all([
          notificationService.createNotification({
            user_id: admin.id,
            type: 'currency_updated',
            message: messages.CURRENCY.UPDATED_NOTIFICATION(updated.label),
          }),
          messageService.createMessage({
            sender_id: senderId || admin.id,
            receiver_id: admin.id,
            message: messages.CURRENCY.UPDATED_NOTIFICATION(updated.label),
          }),
        ])
      )
    );
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: messages.CURRENCY.CODE_EXISTS });
    }
    throw err;
  }
});

/**
 * Delete a currency by ID and notify administrators.
 */
exports.deleteCurrency = catchAsync(async (req, res) => {
  const existing = await service.getById(req.params.id);
  if (existing?.logo_url) {
    const old = path.join(__dirname, '../../../', existing.logo_url);
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }
  await service.remove(req.params.id);
  sendSuccess(res, null, messages.CURRENCY.DELETED);
  const admins = await userModel.findAdmins();
  const senderId = req.user?.id;
  await Promise.all(
    admins.map((admin) =>
      Promise.all([
        notificationService.createNotification({
          user_id: admin.id,
          type: 'currency_deleted',
          message: messages.CURRENCY.DELETED_NOTIFICATION(
            existing?.label || req.params.id
          ),
        }),
        messageService.createMessage({
          sender_id: senderId || admin.id,
          receiver_id: admin.id,
          message: messages.CURRENCY.DELETED_NOTIFICATION(
            existing?.label || req.params.id
          ),
        }),
      ])
    )
  );
});
