const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { v4: uuidv4 } = require("uuid");
const model = require("./invoice.model");

const uploadDir = path.join(__dirname, "../../../uploads/invoices");

const buildAbsolutePath = (pdfUrl) => {
  if (!pdfUrl) return null;
  return path.join(__dirname, "../../../", pdfUrl.replace(/^\//, ""));
};

const resolveInvoicePath = (invoiceOrUrl) => {
  if (!invoiceOrUrl) return null;
  if (typeof invoiceOrUrl === "string") {
    return buildAbsolutePath(invoiceOrUrl);
  }
  if (invoiceOrUrl.pdf_path) {
    return invoiceOrUrl.pdf_path;
  }
  return buildAbsolutePath(invoiceOrUrl.pdf_url);
};

const withResolvedPath = (invoice) => {
  if (!invoice) return invoice;
  const pdf_path = resolveInvoicePath(invoice);
  if (pdf_path && invoice.pdf_path !== pdf_path) {
    return { ...invoice, pdf_path };
  }
  return invoice;
};

exports.resolveInvoicePath = resolveInvoicePath;

exports.generateFromPayment = async (payment, user) => {
  const existing = await model.findByPayment(payment.id);
  if (existing) return withResolvedPath(existing);

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
  return withResolvedPath(created);
};

exports.getInvoices = () => model.getAll();
exports.getInvoice = (id) => model.getById(id);
exports.getInvoicesByUser = (user_id) => model.getByUser(user_id);
exports.getInvoiceByPaymentId = (payment_id) =>
  model.findByPayment(payment_id);
