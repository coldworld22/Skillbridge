const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { v4: uuidv4 } = require("uuid");
const model = require("./invoice.model");
const db = require("../../config/database");
const logger = require("../../utils/logger");
const paymentConfigService = require("../paymentConfig/paymentConfig.service");

const uploadDir = path.join(__dirname, "../../../uploads/invoices");
const projectRoot = path.join(__dirname, "../../../");
const CURRENT_LAYOUT_VERSION = "2025-02";

const fetchFn =
  typeof global.fetch === "function"
    ? (...args) => global.fetch(...args)
    : (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const withFilePath = (invoice) => {
  if (!invoice) return invoice;
  const relative = invoice.pdf_url ? invoice.pdf_url.replace(/^\//, "") : null;
  const filePath = relative ? path.join(projectRoot, relative) : null;
  return { ...invoice, file_path: filePath };
};

const fileExists = async (filePath) => {
  if (!filePath) return false;
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
    return true;
  } catch (err) {
    return false;
  }
};

const generateInvoiceNumber = (issueDate, seed) => {
  const baseDate =
    issueDate instanceof Date && !Number.isNaN(issueDate.getTime())
      ? issueDate
      : new Date();
  const dateStamp = `${baseDate.getFullYear()}${String(
    baseDate.getMonth() + 1
  ).padStart(2, "0")}${String(baseDate.getDate()).padStart(2, "0")}`;
  const cleanedSeed = (seed || "")
    .toString()
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  const suffix = cleanedSeed.slice(0, 6).padEnd(6, "0");
  return `INV-${dateStamp}-${suffix}`;
};

const formatDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const formatDisplayDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (amount, currency = "USD") => {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(numeric);
  } catch (err) {
    return `${currency.toUpperCase()} ${numeric.toFixed(2)}`;
  }
};

const capitalize = (value) =>
  value
    ? value
        .toString()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "";

const loadLogoBuffer = async (logoUrl) => {
  if (!logoUrl) return null;
  try {
    if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
      const res = await fetchFn(logoUrl);
      if (!res.ok) {
        throw new Error(`Logo request failed with status ${res.status}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    const cleaned = logoUrl.replace(/^\//, "");
    const filePath = path.isAbsolute(logoUrl)
      ? logoUrl
      : path.join(projectRoot, cleaned);
    const exists = await fs.promises
      .access(filePath, fs.constants.R_OK)
      .then(() => true)
      .catch(() => false);
    if (!exists) return null;
    return await fs.promises.readFile(filePath);
  } catch (err) {
    logger.warn(
      `[invoices.service] Failed to load invoice logo from "${logoUrl}": ${err.message}`
    );
    return null;
  }
};

const loadPaymentSettings = async () => {
  try {
    return await paymentConfigService.getSettings();
  } catch (err) {
    logger.warn(
      `[invoices.service] Failed to read payment settings: ${err.message}`
    );
    return null;
  }
};

const loadMethodDetails = async (methodId) => {
  if (!methodId) return null;
  try {
    return await db("payment_methods_config")
      .where({ id: methodId })
      .first(["id", "name", "type"]);
  } catch (err) {
    logger.warn(
      `[invoices.service] Failed to load payment method ${methodId}: ${err.message}`
    );
    return null;
  }
};

const loadInstructor = async (instructorId) => {
  if (!instructorId) return null;
  try {
    const instructor = await db("users")
      .where({ id: instructorId })
      .first(["id", "full_name", "email"]);
    if (!instructor) return null;
    return {
      id: instructor.id,
      name: instructor.full_name,
      email: instructor.email,
    };
  } catch (err) {
    logger.warn(
      `[invoices.service] Failed to load instructor ${instructorId}: ${err.message}`
    );
    return null;
  }
};

const loadItemDetails = async (payment) => {
  if (!payment?.item_type || !payment?.item_id) return null;
  const type = payment.item_type;
  const id = String(payment.item_id);
  try {
    if (type === "class") {
      const record = await db("online_classes")
        .where({ id })
        .first([
          "id",
          "title",
          "price",
          "currency",
          "instructor_id",
          "start_date",
        ]);
      if (!record) return null;
      const instructor = await loadInstructor(record.instructor_id);
      return {
        id: record.id,
        type: "class",
        title: record.title,
        price: record.price,
        currency: record.currency || payment.currency,
        instructor,
        schedule: record.start_date,
      };
    }
    if (type === "tutorial") {
      const record = await db("tutorials")
        .where({ id })
        .first([
          "id",
          "title",
          "price",
          "currency",
          "instructor_id",
          "level",
        ]);
      if (!record) return null;
      const instructor = await loadInstructor(record.instructor_id);
      return {
        id: record.id,
        type: "tutorial",
        title: record.title,
        price: record.price,
        currency: record.currency || payment.currency,
        instructor,
        level: record.level,
      };
    }
    if (type === "book") {
      const record = await db("books")
        .where({ id })
        .first(["id", "title", "price", "currency", "instructor_id"]);
      if (!record) return null;
      const instructor = await loadInstructor(record.instructor_id);
      return {
        id: record.id,
        type: "book",
        title: record.title,
        price: record.price,
        currency: record.currency || payment.currency,
        instructor,
      };
    }
    if (type === "plan") {
      const record = await db("plans")
        .where({ id })
        .first([
          "id",
          "name",
          "price_monthly",
          "price_yearly",
          "currency",
          "interval",
        ]);
      if (!record) return null;
      return {
        id: record.id,
        type: "plan",
        title: record.name,
        price_monthly: record.price_monthly,
        price_yearly: record.price_yearly,
        currency: record.currency || payment.currency,
        interval: record.interval,
      };
    }
  } catch (err) {
    logger.warn(
      `[invoices.service] Failed to load item ${type}:${id}: ${err.message}`
    );
  }
  return null;
};

exports.generateFromPayment = async (payment, user, tenantId = null) => {
  const tenantContext = tenantId || payment?.tenant_id || null;
  const existingRaw = await model.findByPayment(payment.id, tenantContext);
  const existing = withFilePath(existingRaw);

  const existingLayoutVersion =
    existing?.details?.meta?.layoutVersion || existing?.details?.layoutVersion;
  const hasFreshPdf = await fileExists(existing?.file_path);
  if (existing && existingLayoutVersion === CURRENT_LAYOUT_VERSION && hasFreshPdf) {
    return existing;
  }

  await fs.promises.mkdir(uploadDir, { recursive: true });

  const id = existing?.id || uuidv4();
  const fileName = `${id}.pdf`;
  const filePath = path.join(uploadDir, fileName);

  const [
    settings,
    methodDetails,
    itemDetails,
  ] = await Promise.all([
    loadPaymentSettings(),
    loadMethodDetails(payment.method_id),
    loadItemDetails(payment),
  ]);

  const invoiceSettings = settings?.invoice || {};
  const appName =
    settings?.appName || process.env.APP_NAME || "SkillBridge";
  const supportEmail =
    settings?.supportEmail ||
    process.env.SUPPORT_EMAIL ||
    "support@example.com";
  const companyName = invoiceSettings.companyName || settings?.companyName || appName;
  const companyAddress = invoiceSettings.companyAddress || settings?.companyAddress || null;
  const companyPhone =
    invoiceSettings.companyPhone ||
    settings?.supportPhone ||
    settings?.phone ||
    null;
  const issueDateRaw =
    existing?.details?.invoice?.issue_date ||
    payment.paid_at ||
    payment.updated_at ||
    payment.created_at ||
    new Date();
  const issueDate = new Date(issueDateRaw);
  const dueDate = existing?.details?.invoice?.due_date
    ? new Date(existing.details.invoice.due_date)
    : payment.next_due_date
    ? new Date(payment.next_due_date)
    : issueDate;
  const methodName =
    payment.method_name ||
    methodDetails?.name ||
    capitalize(methodDetails?.type) ||
    (payment.method_id ? `Method ${payment.method_id}` : "N/A");
  const itemCurrency =
    itemDetails?.currency || payment.currency || settings?.currency || "USD";
  const itemPrice =
    itemDetails?.price ??
    itemDetails?.price_monthly ??
    itemDetails?.price_yearly ??
    payment.amount;
  const qty = 1;
  const total = Number(payment.amount) || Number(itemPrice) || 0;
  const statusLabel = capitalize(payment.status || "pending");
  const description = itemDetails?.title
    ? `${capitalize(itemDetails.type)}: ${itemDetails.title}`
    : payment.item_type
    ? `Payment for ${capitalize(payment.item_type)}`
    : "Payment";
  const installmentInfo =
    payment.installments && payment.installments > 1
      ? ` (Installment ${payment.installment_number || 1} of ${
          payment.installments
        })`
      : "";

  const invoiceNumber =
    existing?.details?.invoice?.number || generateInvoiceNumber(issueDate, id);

  const logoBuffer = await loadLogoBuffer(invoiceSettings.logoUrl);

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.info.Title = `Invoice ${invoiceNumber}`;
  doc.info.Author = appName;

  const pageWidth = doc.page.width;
  const marginLeft = doc.page.margins.left;
  const marginRight = doc.page.margins.right;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const detailRows = [
    { label: "Invoice No.", value: invoiceNumber },
    { label: "Issued", value: formatDisplayDate(issueDate) },
    {
      label: "Due",
      value: payment.next_due_date
        ? formatDisplayDate(dueDate)
        : "Upon Receipt",
    },
    { label: "Status", value: statusLabel },
  ];

  const detailRowHeight = 28;
  const topBoxHeight = Math.max(160, detailRows.length * detailRowHeight + 72);
  const leftColumnWidth = Math.floor(contentWidth * 0.48);
  const rightColumnWidth = contentWidth - leftColumnWidth;
  const topBoxY = doc.page.margins.top;

  doc
    .save()
    .lineWidth(1)
    .strokeColor("#D1D5DB")
    .roundedRect(marginLeft, topBoxY, contentWidth, topBoxHeight, 12)
    .fillAndStroke("#F9FAFB", "#D1D5DB");
  doc.restore();

  doc
    .save()
    .lineWidth(1)
    .strokeColor("#E5E7EB")
    .moveTo(marginLeft + leftColumnWidth, topBoxY)
    .lineTo(marginLeft + leftColumnWidth, topBoxY + topBoxHeight)
    .stroke();
  doc.restore();

  const leftContentX = marginLeft + 20;
  const leftContentY = topBoxY + 24;
  const maxLogoWidth = leftColumnWidth - 40;

  if (logoBuffer) {
    doc.image(logoBuffer, leftContentX, leftContentY, {
      fit: [maxLogoWidth, 64],
      align: "left",
      valign: "center",
    });
  } else {
    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor("#111827")
      .text(appName, leftContentX, leftContentY, {
        width: maxLogoWidth,
      });
  }

  const contactStartY = Math.min(
    topBoxY + topBoxHeight - 48,
    logoBuffer ? leftContentY + 72 : leftContentY + 32
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#9CA3AF")
    .text("Bill From", leftContentX, contactStartY, {
      width: maxLogoWidth,
    });

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#111827")
    .text(companyName, leftContentX, doc.y + 6, {
      width: maxLogoWidth,
    });

  if (companyAddress) {
    const addressLines = Array.isArray(companyAddress)
      ? companyAddress
      : String(companyAddress).split(/\r?\n/);
    doc.font("Helvetica").fontSize(10).fillColor("#4B5563");
    addressLines.forEach((line) => {
      if (line) {
        doc.text(line, leftContentX, doc.y + 4, { width: maxLogoWidth });
      }
    });
  }

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#4B5563")
    .text(`Email: ${supportEmail}`, leftContentX, doc.y + 6, {
      width: maxLogoWidth,
    });

  if (companyPhone) {
    doc.text(`Phone: ${companyPhone}`, leftContentX, doc.y + 4, {
      width: maxLogoWidth,
    });
  }

  const detailTableX = marginLeft + leftColumnWidth + 16;
  const detailTableWidth = rightColumnWidth - 32;
  const tableContainerWidth = detailTableWidth + 24;
  const detailTableTop = topBoxY + 52;

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#111827")
    .text("INVOICE", detailTableX - 12, topBoxY + 20, {
      width: tableContainerWidth,
      align: "right",
    });

  doc
    .save()
    .lineWidth(1)
    .strokeColor("#D1D5DB")
    .roundedRect(
      detailTableX - 12,
      detailTableTop,
      tableContainerWidth,
      detailRows.length * detailRowHeight,
      8
    )
    .stroke();
  doc.restore();

  detailRows.forEach((row, index) => {
    const rowTop = detailTableTop + index * detailRowHeight;
    if (index % 2 === 0) {
      doc
        .save()
        .fillColor("#F3F4F6")
        .rect(
          detailTableX - 11,
          rowTop,
          tableContainerWidth - 2,
          detailRowHeight
        )
        .fill();
      doc.restore();
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#6B7280")
      .text(row.label, detailTableX, rowTop + 8, {
        width: detailTableWidth * 0.45,
      });

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#111827")
      .text(row.value, detailTableX + detailTableWidth * 0.45, rowTop + 6, {
        width: detailTableWidth * 0.55,
        align: "right",
      });
  });

  doc
    .save()
    .lineWidth(1)
    .strokeColor("#E5E7EB");
  for (let i = 1; i < detailRows.length; i += 1) {
    const y = detailTableTop + i * detailRowHeight;
    doc
      .moveTo(detailTableX - 12, y)
      .lineTo(detailTableX - 12 + tableContainerWidth, y);
  }
  doc.stroke();
  doc.restore();

  const infoSectionStartY = topBoxY + topBoxHeight + 32;
  doc.y = infoSectionStartY;

  const drawInfoSection = (x, width, title, lines) => {
    const lineHeight = 16;
    const sectionHeight = 32 + Math.max(lines.length, 1) * lineHeight;

    doc
      .save()
      .lineWidth(1)
      .strokeColor("#E5E7EB")
      .roundedRect(x, doc.y, width, sectionHeight, 8)
      .fillAndStroke("#FFFFFF", "#E5E7EB");
    doc.restore();

    let textY = doc.y + 14;
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#111827")
      .text(title, x + 14, textY, {
        width: width - 28,
      });

    textY += 18;
    doc.font("Helvetica").fontSize(11).fillColor("#374151");

    if (lines.length === 0) {
      doc.text("N/A", x + 14, textY, { width: width - 28 });
    } else {
      lines.forEach((line) => {
        doc.text(line, x + 14, textY, { width: width - 28 });
        textY += lineHeight;
      });
    }

    return sectionHeight;
  };

  const columnGap = 20;
  const columnWidth = (contentWidth - columnGap) / 2;

  const billToLines = [user?.full_name || user?.name || "Student"];
  if (user?.email) billToLines.push(user.email);
  if (user?.phone) billToLines.push(user.phone);

  const paymentLines = [
    `Invoice ID: ${id}`,
    `Payment ID: ${payment.id}`,
    `Method: ${methodName}`,
  ];
  if (payment.reference_id) {
    paymentLines.push(`Reference: ${payment.reference_id}`);
  }
  paymentLines.push(`Amount: ${formatCurrency(total, itemCurrency)}`);
  if (itemDetails?.instructor?.name) {
    paymentLines.push(`Instructor: ${itemDetails.instructor.name}`);
    if (itemDetails.instructor.email) {
      paymentLines.push(itemDetails.instructor.email);
    }
  }

  const leftSectionHeight = drawInfoSection(marginLeft, columnWidth, "Bill To", billToLines);
  const rightSectionHeight = drawInfoSection(
    marginLeft + columnWidth + columnGap,
    columnWidth,
    "Payment Details",
    paymentLines
  );

  doc.y = infoSectionStartY + Math.max(leftSectionHeight, rightSectionHeight) + 28;

  const items = [
    {
      description: `${description}${installmentInfo}`,
      quantity: qty,
      unitPrice: formatCurrency(itemPrice, itemCurrency),
      total: formatCurrency(total, itemCurrency),
    },
  ];

  if (doc.y > doc.page.height - doc.page.margins.bottom - 260) {
    doc.addPage();
    doc.y = doc.page.margins.top;
  }

  const tableTop = doc.y;
  const tableLeft = marginLeft;
  const tableWidth = contentWidth;
  const tableHeaderHeight = 26;
  const tableRowHeight = 28;
  const tableHeight = tableHeaderHeight + items.length * tableRowHeight;

  const columnWidths = {
    description: Math.round(tableWidth * 0.5),
    quantity: Math.round(tableWidth * 0.15),
    unitPrice: Math.round(tableWidth * 0.18),
  };
  columnWidths.total =
    tableWidth - columnWidths.description - columnWidths.quantity - columnWidths.unitPrice;

  const columnX = {
    description: tableLeft,
    quantity: tableLeft + columnWidths.description,
    unitPrice: tableLeft + columnWidths.description + columnWidths.quantity,
    total:
      tableLeft +
      columnWidths.description +
      columnWidths.quantity +
      columnWidths.unitPrice,
  };

  doc
    .save()
    .lineWidth(1)
    .strokeColor("#D1D5DB")
    .roundedRect(tableLeft, tableTop, tableWidth, tableHeight, 10)
    .stroke();
  doc.restore();

  doc
    .save()
    .fillColor("#F3F4F6")
    .roundedRect(tableLeft, tableTop, tableWidth, tableHeaderHeight, 10)
    .fill();
  doc.restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#111827")
    .text("Description", columnX.description + 12, tableTop + 7, {
      width: columnWidths.description - 24,
    })
    .text("Qty", columnX.quantity + 6, tableTop + 7, {
      width: columnWidths.quantity - 12,
      align: "center",
    })
    .text("Unit Price", columnX.unitPrice + 6, tableTop + 7, {
      width: columnWidths.unitPrice - 12,
      align: "right",
    })
    .text("Total", columnX.total + 6, tableTop + 7, {
      width: columnWidths.total - 12,
      align: "right",
    });

  doc
    .save()
    .lineWidth(1)
    .strokeColor("#E5E7EB")
    .moveTo(columnX.quantity, tableTop)
    .lineTo(columnX.quantity, tableTop + tableHeight)
    .moveTo(columnX.unitPrice, tableTop)
    .lineTo(columnX.unitPrice, tableTop + tableHeight)
    .moveTo(columnX.total, tableTop)
    .lineTo(columnX.total, tableTop + tableHeight)
    .stroke();
  doc.restore();

  let currentRowTop = tableTop + tableHeaderHeight;
  items.forEach((item, index) => {
    if (index % 2 === 1) {
      doc
        .save()
        .fillColor("#F9FAFB")
        .rect(tableLeft, currentRowTop, tableWidth, tableRowHeight)
        .fill();
      doc.restore();
    }

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#111827")
      .text(item.description, columnX.description + 12, currentRowTop + 6, {
        width: columnWidths.description - 24,
      })
      .text(String(item.quantity), columnX.quantity + 6, currentRowTop + 6, {
        width: columnWidths.quantity - 12,
        align: "center",
      })
      .text(item.unitPrice, columnX.unitPrice + 6, currentRowTop + 6, {
        width: columnWidths.unitPrice - 12,
        align: "right",
      })
      .text(item.total, columnX.total + 6, currentRowTop + 6, {
        width: columnWidths.total - 12,
        align: "right",
      });

    if (index !== items.length - 1) {
      doc
        .save()
        .lineWidth(1)
        .strokeColor("#E5E7EB")
        .moveTo(tableLeft, currentRowTop + tableRowHeight)
        .lineTo(tableLeft + tableWidth, currentRowTop + tableRowHeight)
        .stroke();
      doc.restore();
    }

    currentRowTop += tableRowHeight;
  });

  doc.y = tableTop + tableHeight + 24;

  const summaryWidth = Math.min(260, columnWidths.unitPrice + columnWidths.total);
  const summaryX = tableLeft + tableWidth - summaryWidth;
  const summaryLineHeight = 22;
  const summaryLines = [
    { label: "Subtotal", value: formatCurrency(total, itemCurrency), bold: false },
    { label: "Total Due", value: formatCurrency(total, itemCurrency), bold: true },
  ];
  const summaryHeight = 24 + summaryLines.length * summaryLineHeight;

  doc
    .save()
    .lineWidth(1)
    .strokeColor("#E5E7EB")
    .roundedRect(summaryX, doc.y, summaryWidth, summaryHeight, 8)
    .fillAndStroke("#FFFFFF", "#E5E7EB");
  doc.restore();

  let summaryTextY = doc.y + 14;
  const summaryLabelWidth = summaryWidth / 2;
  summaryLines.forEach((line) => {
    doc
      .font(line.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(line.bold ? 12 : 11)
      .fillColor(line.bold ? "#111827" : "#6B7280")
      .text(line.label, summaryX + 16, summaryTextY, {
        width: summaryLabelWidth - 16,
      });

    doc
      .font(line.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(line.bold ? 14 : 12)
      .fillColor("#111827")
      .text(line.value, summaryX + summaryLabelWidth, summaryTextY - 2, {
        width: summaryWidth - summaryLabelWidth - 16,
        align: "right",
      });

    summaryTextY += summaryLineHeight;
  });

  doc.y = Math.max(doc.y + summaryHeight + 16, summaryTextY + 10);

  if (doc.y > doc.page.height - doc.page.margins.bottom - 140) {
    doc.addPage();
    doc.y = doc.page.margins.top;
  }

  const footerSeparatorY = Math.max(
    doc.y + 40,
    doc.page.height - doc.page.margins.bottom - 110
  );

  doc
    .strokeColor("#E5E7EB")
    .lineWidth(1)
    .moveTo(marginLeft, footerSeparatorY - 10)
    .lineTo(pageWidth - marginRight, footerSeparatorY - 10)
    .stroke();

  const footerText =
    invoiceSettings.footerText ||
    "Thank you for your trust in our platform.";

  const footerTextY = footerSeparatorY + 6;

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#6B7280")
    .text(footerText, marginLeft, footerTextY, {
      width: contentWidth,
      align: "center",
    })
    .text(`Contact us: ${supportEmail}`, marginLeft, doc.y + 4, {
      width: contentWidth,
      align: "center",
    });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  const pdfRelativePath = `/uploads/invoices/${fileName}`;

  const detailsPayload = {
    invoice: {
      id,
      number: invoiceNumber,
      issue_date: formatDate(issueDate),
      due_date: payment.next_due_date ? formatDate(dueDate) : null,
      currency: itemCurrency,
      subtotal: total,
      total,
    },
    payment: {
      id: payment.id,
      item_type: payment.item_type,
      item_id: payment.item_id,
      method_id: payment.method_id,
      method_name: methodName,
      status: payment.status,
      reference_id: payment.reference_id,
      paid_at: formatDate(payment.paid_at),
      created_at: formatDate(payment.created_at),
    },
    item: itemDetails,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || null,
    },
    settings: {
      appName,
      supportEmail,
      companyName,
      companyAddress,
      companyPhone,
      logoUrl: invoiceSettings.logoUrl || null,
      footerText,
    },
    meta: {
      layoutVersion: CURRENT_LAYOUT_VERSION,
      generatedAt: formatDate(new Date()),
    },
  };

  const baseRecord = {
    payment_id: payment.id,
    user_id: payment.user_id,
    amount: payment.amount,
    currency: payment.currency,
    pdf_url: pdfRelativePath,
    details: detailsPayload,
    updated_at: new Date(),
  };

  let saved;
  if (existing) {
    saved = await model.update(id, baseRecord, tenantContext);
  } else {
    const createPayload = { id, created_at: new Date(), ...baseRecord };
    if (tenantContext) {
      createPayload.tenant_id = tenantContext;
    }
    saved = await model.create(createPayload, tenantContext);
  }

  return withFilePath({ ...saved, pdf_url: pdfRelativePath });
};

exports.getInvoices = (tenantId = null) =>
  model.getAll(tenantId).then((rows) => rows.map(withFilePath));
exports.getInvoice = (id, tenantId = null) =>
  model.getById(id, tenantId).then(withFilePath);
exports.getInvoicesByUser = (user_id, tenantId = null) =>
  model.getByUser(user_id, tenantId).then((rows) => rows.map(withFilePath));
exports.getInvoiceByPaymentId = (payment_id, tenantId = null) =>
  model.findByPayment(payment_id, tenantId).then(withFilePath);
