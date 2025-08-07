const service = require("./book.service");
const tagService = require("./bookTag.service");
const slugify = require("slugify");

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
  const tagIds = [];
  for (const name of tags) {
    const existing = await tagService.findByName(name);
    const tag =
      existing ||
      (await tagService.createTag({
        name,
        slug: slugify(name, { lower: true, strict: true }),
      }));
    tagIds.push(tag.id);
  }
  await service.addBookTags(bookId, tagIds);
  return await service.getBookTags(bookId);
};
