const service = require('./currencies.service');
const catchAsync = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/response');
const AppError = require('../../utils/AppError');
const path = require('path');
const fs = require('fs');

exports.createCurrency = catchAsync(async (req, res) => {
  const { label, code, symbol, exchange_rate } = req.body;
  if (!label || !code || !symbol)
    throw new AppError('Label, code and symbol are required', 400);
  if (exchange_rate && isNaN(Number(exchange_rate))) {
    throw new AppError('Invalid exchange rate', 400);
  }

  const data = { ...req.body };
  if (req.file) {
    data.logo_url = `/uploads/currencies/${req.file.filename}`;
  }
  // Coerce numeric and boolean values from multipart/form-data
  if (data.exchange_rate) data.exchange_rate = Number(data.exchange_rate);
  ['is_active', 'is_default', 'auto_update'].forEach((k) => {
    if (data[k] !== undefined) data[k] = data[k] === 'true' || data[k] === true;
  });

  try {
    const currency = await service.create(data);
    sendSuccess(res, currency, 'Currency created');
  } catch (err) {
    if (err.code === '23505') {
      // duplicate currency code
      return res.status(400).json({ message: 'Currency code already exists' });
    }
    throw err;
  }
});

exports.listCurrencies = catchAsync(async (_req, res) => {
  const list = await service.list();
  sendSuccess(res, list);
});

exports.updateCurrency = catchAsync(async (req, res) => {
  const existing = await service.getById(req.params.id);
  if (!existing) throw new AppError('Currency not found', 404);

  const { label, code, symbol, exchange_rate } = req.body;
  if (label !== undefined && !label) {
    throw new AppError('Label is required', 400);
  }
  if (code !== undefined && !code) {
    throw new AppError('Code is required', 400);
  }
  if (symbol !== undefined && !symbol) {
    throw new AppError('Symbol is required', 400);
  }
  if (exchange_rate && isNaN(Number(exchange_rate))) {
    throw new AppError('Invalid exchange rate', 400);
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
  ['is_active', 'is_default', 'auto_update'].forEach((k) => {
    if (data[k] !== undefined) data[k] = data[k] === 'true' || data[k] === true;
  });

  try {
    const updated = await service.update(req.params.id, data);
    sendSuccess(res, updated, 'Currency updated');
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Currency code already exists' });
    }
    throw err;
  }
});

exports.deleteCurrency = catchAsync(async (req, res) => {
  const existing = await service.getById(req.params.id);
  if (existing?.logo_url) {
    const old = path.join(__dirname, '../../../', existing.logo_url);
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }
  await service.remove(req.params.id);
  sendSuccess(res, null, 'Currency deleted');
});
