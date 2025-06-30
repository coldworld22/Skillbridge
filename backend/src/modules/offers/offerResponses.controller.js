const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const responseService = require("./offerResponses.service");
const messageService = require("./offerMessages.service");
const userMessageService = require("../messages/messages.service");
const notificationService = require("../notifications/notifications.service");
const offerService = require("./offers.service");

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

  const offer = await offerService.getOfferById(offerId);
  if (offer) {
    await notificationService.createNotification({
      user_id: offer.student_id,
      type: "offer_response",
      message: `${req.user.full_name} responded to your offer`,
    });
    await userMessageService.createMessage({
      sender_id: req.user.id,
      receiver_id: offer.student_id,
      message: `${req.user.full_name} responded to your offer`,
    });
  }

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

  const receiverId =
    req.user.id === resp.instructor_id ? resp.student_id : resp.instructor_id;
  await userMessageService.createMessage({
    sender_id: req.user.id,
    receiver_id: receiverId,
    message: `Offer message: ${message.trim()}`,
  });

  await notificationService.createNotification({
    user_id: receiverId,
    type: "offer_message",
    message: `${req.user.full_name} replied to an offer`,
  });

  sendSuccess(res, msg, "Message sent");
});

exports.deleteMessage = catchAsync(async (req, res) => {
  const { responseId, messageId } = req.params;
  const msg = await messageService.getMessageById(messageId);
  if (!msg || msg.response_id !== responseId) {
    throw new AppError("Message not found", 404);
  }
  if (msg.sender_id !== req.user.id) {
    throw new AppError("Not authorized", 403);
  }
  await messageService.deleteMessage(messageId);
  sendSuccess(res, null, "Message deleted");
});
