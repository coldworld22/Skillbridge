const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const responseService = require("./offerResponses.service");
const messageService = require("./offerMessages.service");

exports.createResponse = catchAsync(async (req, res) => {
  const { offerId } = req.params;
  const { proposed_price, estimated_time, notes } = req.body || {};
  const data = {
    offer_id: offerId,
    instructor_id: req.user.id,
    proposed_price,
    estimated_time,
    notes,
    status: "pending",
  };
  const response = await responseService.createResponse(data);
  sendSuccess(res, response, "Response created");
});

exports.listResponses = catchAsync(async (req, res) => {
  const { offerId } = req.params;
  const responses = await responseService.getResponsesByOffer(offerId);
  sendSuccess(res, responses);
});

exports.getMessages = catchAsync(async (req, res) => {
  const { responseId } = req.params;
  const messages = await messageService.getMessages(responseId);
  sendSuccess(res, messages);
});

exports.sendMessage = catchAsync(async (req, res) => {
  const { responseId } = req.params;
  const { message, replyTo } = req.body || {};
  if (!message || !message.trim()) {
    throw new AppError("Message required", 400);
  }
  const resp = await responseService.getResponseWithOffer(responseId);
  if (!resp) throw new AppError("Response not found", 404);
  if (req.user.id !== resp.instructor_id && req.user.id !== resp.student_id) {
    throw new AppError("Not authorized", 403);
  }
  const created = await messageService.createMessage({
    response_id: responseId,
    sender_id: req.user.id,
    message: message.trim(),
    reply_to_id: replyTo || null,
  });
  const msg = await messageService.getMessageById(created.id);
  sendSuccess(res, msg, "Message sent");
});
