const path = require("path");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./invoices.service");

exports.getInvoices = catchAsync(async (_req, res) => {
  const data = await service.getInvoices();
  sendSuccess(res, data);
});

exports.getInvoice = catchAsync(async (req, res) => {
  const invoice = await service.getInvoice(req.params.id);
  if (!invoice) throw new AppError("Invoice not found", 404);
  sendSuccess(res, invoice);
});

exports.getMyInvoices = catchAsync(async (req, res) => {
  const data = await service.getInvoicesByUser(req.user.id);
  sendSuccess(res, data);
});

exports.getMyInvoice = catchAsync(async (req, res) => {
  const invoice = await service.getInvoice(req.params.id);
  if (!invoice || invoice.user_id !== req.user.id)
    throw new AppError("Invoice not found", 404);
  sendSuccess(res, invoice);
});

exports.getMyInvoiceByPaymentId = catchAsync(async (req, res) => {
  const invoice = await service.getInvoiceByPaymentId(
    req.params.paymentId
  );
  if (!invoice || invoice.user_id !== req.user.id)
    throw new AppError("Invoice not found", 404);
  sendSuccess(res, invoice);
});

exports.downloadInvoice = catchAsync(async (req, res) => {
  const invoice = await service.getInvoice(req.params.id);
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (
    req.user.role !== "Admin" &&
    req.user.role !== "SuperAdmin" &&
    invoice.user_id !== req.user.id
  ) {
    throw new AppError("Forbidden", 403);
  }
  const filePath = path.join(
    __dirname,
    "../../../",
    invoice.pdf_url.replace(/^\//, "")
  );
  res.download(filePath);
});
