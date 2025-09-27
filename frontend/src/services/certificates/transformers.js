const firstDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null);

const buildTemplate = (certificate = {}) => {
  const baseTemplate =
    certificate.template && Object.keys(certificate.template).length
      ? { ...certificate.template }
      : {};

  const template = {
    id: firstDefined(baseTemplate.id, certificate.template_id, certificate.templateId),
    name: firstDefined(baseTemplate.name, certificate.template_name, certificate.templateName),
    type: firstDefined(baseTemplate.type, certificate.template_type, certificate.templateType),
    font_family: firstDefined(
      baseTemplate.font_family,
      baseTemplate.fontFamily,
      certificate.template_font_family,
      certificate.templateFontFamily,
      certificate.font_family,
      certificate.fontFamily
    ),
    title_font: firstDefined(
      baseTemplate.title_font,
      baseTemplate.titleFont,
      certificate.template_title_font,
      certificate.templateTitleFont,
      certificate.title_font,
      certificate.titleFont
    ),
    border_color: firstDefined(
      baseTemplate.border_color,
      baseTemplate.borderColor,
      certificate.template_border_color,
      certificate.templateBorderColor,
      certificate.border_color,
      certificate.borderColor
    ),
    logo: firstDefined(
      baseTemplate.logo,
      baseTemplate.logoUrl,
      certificate.template_logo,
      certificate.templateLogo,
      certificate.logo,
      certificate.logoUrl
    ),
    background: firstDefined(
      baseTemplate.background,
      baseTemplate.backgroundUrl,
      certificate.template_background,
      certificate.templateBackground,
      certificate.background,
      certificate.backgroundImage
    ),
    show_qr: firstDefined(
      baseTemplate.show_qr,
      baseTemplate.showQr,
      certificate.template_show_qr,
      certificate.templateShowQr,
      certificate.show_qr,
      certificate.showQR
    ),
    active: firstDefined(
      baseTemplate.active,
      certificate.template_active,
      certificate.templateActive
    ),
    created_at: firstDefined(
      baseTemplate.created_at,
      certificate.template_created_at,
      certificate.templateCreatedAt
    ),
    updated_at: firstDefined(
      baseTemplate.updated_at,
      certificate.template_updated_at,
      certificate.templateUpdatedAt
    ),
  };

  const hasData = Object.values(template).some(
    (value) => value !== undefined && value !== null
  );

  return hasData ? template : undefined;
};

export const normalizeCertificate = (certificate) => {
  if (!certificate) return certificate;

  const normalized = { ...certificate };

  const ensureField = (key, ...fallbacks) => {
    if (normalized[key] !== undefined && normalized[key] !== null) {
      return;
    }

    const value = firstDefined(...fallbacks);
    if (value !== undefined) {
      normalized[key] = value;
    }
  };

  ensureField("studentName", certificate.student_name);
  ensureField(
    "courseTitle",
    certificate.course_title,
    certificate.className,
    certificate.class_name
  );
  ensureField("className", certificate.class_name, normalized.courseTitle);
  ensureField("issueDate", certificate.issue_date, certificate.issued_at);
  ensureField("status", certificate.status_text);
  ensureField("instructorName", certificate.instructor_name);
  ensureField("platformName", certificate.platform_name);
  ensureField("grade", certificate.final_grade);

  const template = buildTemplate(certificate);
  if (template) {
    normalized.template = template;
  }

  return normalized;
};

export const normalizeCertificates = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeCertificate);
};
