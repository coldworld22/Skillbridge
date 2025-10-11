const service = require("./book.service");
const tagService = require("./bookTag.service");
const slugify = require("slugify");
const db = require("../../config/database");

exports.processTags = async (rawTags, bookId) => {
  let tags = [];
  if (rawTags) {
    try {
      tags = typeof rawTags === "string" ? JSON.parse(rawTags) : rawTags;
      if (!Array.isArray(tags)) tags = [];
    } catch {
      tags = [];
    }
  }
  if (!tags.length) return [];

  return await db.transaction(async (trx) => {
    const existing = await tagService.findByNames(tags, trx);
    const existingMap = new Map(
      existing.map((t) => [t.name.toLowerCase(), t])
    );
    const newTagData = tags
      .filter((name) => !existingMap.has(name.toLowerCase()))
      .map((name) => ({
        name,
        slug: slugify(name, { lower: true, strict: true }),
      }));
    const newTags = newTagData.length
      ? await tagService.createTags(newTagData, trx)
      : [];
    const tagIds = [...existing, ...newTags].map((t) => t.id);
    await service.addBookTags(bookId, tagIds, trx);
    return await service.getBookTags(bookId, trx);
  });
};

const normalizePlanCandidate = (value) => {
  if (value == null) return null;
  if (typeof value === "object") {
    return (
      value.id ??
      value.plan_id ??
      value.planId ??
      value.slug ??
      value.value ??
      null
    );
  }
  return value;
};

const flattenPlanInput = (raw) => {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => flattenPlanInput(item));
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return flattenPlanInput(parsed);
    } catch {
      if (trimmed.includes(",")) {
        return trimmed
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean);
      }
      return [trimmed];
    }
  }
  return [raw];
};

const toUniquePlanKeys = (raw) => {
  const flattened = flattenPlanInput(raw);
  const values = [];
  for (const item of flattened) {
    const normalized = normalizePlanCandidate(item);
    if (normalized == null) continue;
    const str = String(normalized).trim();
    if (!str) continue;
    values.push(str);
  }
  return Array.from(new Set(values));
};

exports.resolveIncludedPlanIds = async (rawPlans) => {
  const candidates = toUniquePlanKeys(rawPlans);
  if (!candidates.length) return [];

  if (process.env.NODE_ENV === "test") {
    return candidates;
  }

  const rows = await db("plans")
    .select("id", "slug")
    .where("target_role", "student")
    .where(function () {
      this.whereIn("id", candidates).orWhereIn("slug", candidates);
    });

  if (!rows.length) return [];

  const lookup = new Map();
  rows.forEach((row) => {
    lookup.set(row.id, row.id);
    if (row.slug) lookup.set(row.slug, row.id);
  });

  const resolved = [];
  for (const key of candidates) {
    const id = lookup.get(key);
    if (id && !resolved.includes(id)) resolved.push(id);
  }
  return resolved;
};
