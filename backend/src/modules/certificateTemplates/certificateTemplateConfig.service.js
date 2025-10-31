const db = require("../../config/database");
const AppError = require("../../utils/AppError");
const {
  readJsonSetting,
  writeJsonSetting,
} = require("../../utils/settingsStore");

const SETTINGS_KEY = "certificate_template_settings";
const CONTEXTS = ["tutorial", "online_class"];
const CONTEXT_FLAG_MAP = {
  tutorial: "for_tutorials",
  online_class: "for_online_classes",
};

const normalizeSettings = (rawSettings) => {
  const normalized = {};
  CONTEXTS.forEach((context) => {
    normalized[context] = rawSettings?.[context] ?? null;
  });
  return normalized;
};

const ensureTemplateSupportsContext = async (templateId, context) => {
  const template = await db("certificate_templates")
    .where({ id: templateId })
    .first([
      "id",
      "name",
      "active",
      "for_tutorials",
      "for_online_classes",
    ]);

  if (!template) {
    throw new AppError("Template not found", 404);
  }

  if (!template.active) {
    throw new AppError(
      `Template "${template.name}" is inactive. Activate it before assigning.`,
      400
    );
  }

  const flag = CONTEXT_FLAG_MAP[context];
  if (flag && template[flag] === false) {
    const contextLabel =
      context === "tutorial" ? "tutorial certificates" : "online class certificates";
    throw new AppError(
      `Template "${template.name}" is not enabled for ${contextLabel}.`,
      400
    );
  }

  return template.id;
};

exports.getSettings = async () => {
  const stored = (await readJsonSetting(SETTINGS_KEY)) || {};
  return normalizeSettings(stored);
};

exports.updateSettings = async (payload = {}) => {
  const current = await exports.getSettings();
  const next = { ...current };

  for (const [context, templateId] of Object.entries(payload)) {
    if (!CONTEXTS.includes(context)) continue;
    if (!templateId) {
      next[context] = null;
      continue;
    }
    next[context] = await ensureTemplateSupportsContext(templateId, context);
  }

  await writeJsonSetting(SETTINGS_KEY, next);
  return next;
};

exports.resolveTemplateIdForContext = async (context) => {
  if (!CONTEXTS.includes(context)) return null;

  const settings = await exports.getSettings();
  const templateId = settings[context];
  if (!templateId) return null;

  const template = await db("certificate_templates")
    .where({ id: templateId })
    .andWhere({ active: true })
    .first([ "id", CONTEXT_FLAG_MAP[context] ]);

  if (!template) return null;
  const flag = CONTEXT_FLAG_MAP[context];
  if (flag && template[flag] === false) {
    return null;
  }

  return template.id;
};

exports.resolveTemplateForContext = async (context) => {
  const id = await exports.resolveTemplateIdForContext(context);
  if (!id) return null;
  return db("certificate_templates").where({ id }).first();
};

exports.CONTEXTS = CONTEXTS;
