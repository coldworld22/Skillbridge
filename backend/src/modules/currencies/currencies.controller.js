const service = require('./currencies.service');
const catchAsync = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/response');
const AppError = require('../../utils/AppError');
const path = require('path');
const fs = require('fs');

exports.createCurrency = catchAsync(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.logo_url = `/uploads/currencies/${req.file.filename}`;
  }
  const currency = await service.create(data);
  sendSuccess(res, currency, 'Currency created');
});

exports.listCurrencies = catchAsync(async (_req, res) => {
  const list = await service.list();
  sendSuccess(res, list);
});

exports.updateCurrency = catchAsync(async (req, res) => {
  const existing = await service.getById(req.params.id);
  if (!existing) throw new AppError('Currency not found', 404);
  const data = { ...req.body };
  if (req.file) {
    if (existing.logo_url) {
      const old = path.join(__dirname, '../../../', existing.logo_url);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    data.logo_url = `/uploads/currencies/${req.file.filename}`;
  }
  const updated = await service.update(req.params.id, data);
  sendSuccess(res, updated, 'Currency updated');
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
