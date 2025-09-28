const path = require("path");

function normalizePdfUrl(pdfUrl) {
  if (!pdfUrl) return null;
  return pdfUrl.replace(/^\/+/, "");
}

function resolveInvoicePdfPath(invoiceOrUrl) {
  if (!invoiceOrUrl) return null;
  const pdfUrl =
    typeof invoiceOrUrl === "string"
      ? invoiceOrUrl
      : invoiceOrUrl.pdf_url;
  const normalized = normalizePdfUrl(pdfUrl);
  if (!normalized) return null;

  return path.join(__dirname, "../../../../", normalized);
}

module.exports = {
  resolveInvoicePdfPath,
};
