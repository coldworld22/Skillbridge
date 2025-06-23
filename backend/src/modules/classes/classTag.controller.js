const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./classTag.service");
const slugify = require("slugify");

exports.listTags = catchAsync(async (req, res) => {
  const { search = "" } = req.query;
  const tags = search
    ? await service.searchTags(search)
    : await service.getAllTags();
  sendSuccess(res, tags);
});

exports.createTag = catchAsync(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return sendSuccess(res, null, "Name required");
  }
  let tag = await service.findByName(name);
  if (!tag) {
    tag = await service.createTag({
      name,
      slug: slugify(name, { lower: true, strict: true }),
    });
  }
  sendSuccess(res, tag, "Tag created");
});
