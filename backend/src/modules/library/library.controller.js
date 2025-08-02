const service = require("./library.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");

exports.listLibrary = catchAsync(async (req, res) => {
  const items = await service.listForStudent(req.user.id);
  sendSuccess(res, items);
});
