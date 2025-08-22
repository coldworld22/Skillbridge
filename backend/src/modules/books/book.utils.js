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
