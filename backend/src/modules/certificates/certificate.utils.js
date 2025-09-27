const TEMPLATE_SELECT_FIELDS = [
  "certificate_templates.name as template_name",
  "certificate_templates.type as template_type",
  "certificate_templates.font_family as template_font_family",
  "certificate_templates.title_font as template_title_font",
  "certificate_templates.border_color as template_border_color",
  "certificate_templates.logo as template_logo",
  "certificate_templates.background as template_background",
  "certificate_templates.show_qr as template_show_qr",
  "certificate_templates.active as template_active",
  "certificate_templates.created_at as template_created_at",
  "certificate_templates.updated_at as template_updated_at",
];

const TEMPLATE_ALIAS_KEYS = TEMPLATE_SELECT_FIELDS.map((field) => field.split(" as ")[1]);

const applyTemplateJoin = (queryBuilder) =>
  queryBuilder.leftJoin(
    "certificate_templates",
    "certificates.template_id",
    "certificate_templates.id"
  );

const buildTemplateFromRow = (row) => {
  if (!row) return null;

  const templateId = row.template_id ?? row.templateId ?? row["certificates.template_id"];

  if (!templateId) return null;

  const template = {
    id: templateId,
    name: row.template_name ?? row.templateName,
    type: row.template_type ?? row.templateType,
    font_family: row.template_font_family ?? row.templateFontFamily,
    title_font: row.template_title_font ?? row.templateTitleFont,
    border_color: row.template_border_color ?? row.templateBorderColor,
    logo: row.template_logo ?? row.templateLogo,
    background: row.template_background ?? row.templateBackground,
    show_qr: row.template_show_qr ?? row.templateShowQr,
    active: row.template_active ?? row.templateActive,
    created_at: row.template_created_at ?? row.templateCreatedAt,
    updated_at: row.template_updated_at ?? row.templateUpdatedAt,
  };

  const hasData = Object.values(template).some(
    (value) => value !== undefined && value !== null
  );

  return hasData ? template : null;
};

const formatCertificateRow = (row) => {
  if (!row) return row;

  const formatted = { ...row };
  const template = buildTemplateFromRow(row);

  TEMPLATE_ALIAS_KEYS.forEach((key) => {
    delete formatted[key];
  });

  if (template) {
    formatted.template = template;
  }

  return formatted;
};

module.exports = {
  TEMPLATE_SELECT_FIELDS,
  applyTemplateJoin,
  formatCertificateRow,
};
