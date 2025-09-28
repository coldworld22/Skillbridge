const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { v4: uuidv4 } = require("uuid");
const model = require("./invoice.model");

const uploadDir = path.join(__dirname, "../../../uploads/invoices");

const getInvoiceFilePaths = (value) => {
  if (!value) {
    return { publicUrl: null, absolutePath: null, relativePath: null };
  }

  const sanitized = String(value).replace(/\\/g, "/").replace(/^\/+/, "");
  const relativePath = sanitized.startsWith("uploads/invoices")
    ? sanitized
    : path.posix.join("uploads/invoices", sanitized);

  const publicUrl = `/${relativePath}`;
  const absolutePath = path.join(__dirname, "../../../", relativePath);

  return { publicUrl, absolutePath, relativePath };
};

exports.getInvoiceFilePaths = getInvoiceFilePaths;

exports.resolveInvoiceAttachmentPath = (invoice) => {
  if (!invoice || !invoice.pdf_url) {
    return null;
  }

  if (invoice.file_path) {
    return invoice.file_path;
  }

  const { absolutePath } = getInvoiceFilePaths(invoice.pdf_url);
  return absolutePath;
};

exports.generateFromPayment = async (payment, user) => {
  const existing = await model.findByPayment(payment.id);
  if (existing) {
    const paths = getInvoiceFilePaths(existing.pdf_url);
    return { ...existing, file_path: paths.absolutePath };
  }

  await fs.promises.mkdir(uploadDir, { recursive: true });

  const id = uuidv4();
  const fileName = `${id}.pdf`;
  const paths = getInvoiceFilePaths(fileName);
  const filePath = paths.absolutePath;

  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(20).text(`Invoice #${id}`);
  doc.moveDown();
  doc.fontSize(12);
  doc.text(`Date: ${new Date().toISOString()}`);
  doc.text(`Student: ${user.full_name} (${user.email})`);
  doc.text(`Payment ID: ${payment.id}`);
  doc.text(`Amount: ${payment.amount} ${payment.currency}`);
  doc.text(`Status: ${payment.status}`);
  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  const data = {
    id,
    payment_id: payment.id,
    user_id: payment.user_id,
    amount: payment.amount,
    currency: payment.currency,
    pdf_url: paths.publicUrl,
    details: {
      payment: {
        id: payment.id,
        item_type: payment.item_type,
        item_id: payment.item_id,
      },
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
      },
    },
  };

  const created = await model.create(data);
  return { ...created, file_path: filePath };
};

exports.getInvoices = () => model.getAll();
exports.getInvoice = (id) => model.getById(id);
exports.getInvoicesByUser = (user_id) => model.getByUser(user_id);
exports.getInvoiceByPaymentId = (payment_id) =>
  model.findByPayment(payment_id);
