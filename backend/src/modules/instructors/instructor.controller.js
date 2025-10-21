const service = require("./instructor.service");
const { sendSuccess } = require("../../utils/response");
const catchAsync = require("../../utils/catchAsync");
const msgService = require("../messages/messages.service");
const { prepareMessagingQuota } = require("../messages/messageQuota.helper");

exports.list = catchAsync(async (_req, res) => {
  const data = await service.getPublicInstructors();
  sendSuccess(res, data, "Instructors fetched");
});

exports.getById = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    return res.status(400).json({ message: "Invalid instructor id" });
  }

  const instructor = await service.getPublicInstructor(id);
  if (!instructor) {
    return res.status(404).json({ message: "Instructor not found" });
  }
  sendSuccess(res, instructor);
});

exports.getAvailability = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    return res.status(400).json({ message: "Invalid instructor id" });
  }

  const availability = await service.getInstructorAvailability(id);
  sendSuccess(res, availability);
});

exports.sendEmail = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    return res.status(400).json({ message: "Invalid instructor id" });
  }

  const quota = await prepareMessagingQuota(req.user, "email");
  const data = await msgService.sendEmail({
    sender_id: req.user.id,
    receiver_id: id,
    subject: req.body.subject,
    message: req.body.message,
    quota,
  });
  sendSuccess(res, data, "Email sent");
});

exports.sendWhatsApp = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    return res.status(400).json({ message: "Invalid instructor id" });
  }

  const quota = await prepareMessagingQuota(req.user, "whatsapp");
  const data = await msgService.sendWhatsApp({
    sender_id: req.user.id,
    receiver_id: id,
    message: req.body.message,
    quota,
  });
  sendSuccess(res, data, "WhatsApp message sent");
});

exports.startVideoCall = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    return res.status(400).json({ message: "Invalid instructor id" });
  }

  const quota = await prepareMessagingQuota(req.user, "video");
  const data = await msgService.startVideoCall({
    sender_id: req.user.id,
    receiver_id: id,
    quota,
  });
  sendSuccess(res, data, "Video call started");
});
