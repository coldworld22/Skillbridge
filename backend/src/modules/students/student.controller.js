const service = require("./student.service");
const { sendSuccess } = require("../../utils/response");
const catchAsync = require("../../utils/catchAsync");
const msgService = require("../messages/messages.service");
const { prepareMessagingQuota } = require("../messages/messageQuota.helper");

exports.list = async (_req, res) => {
  const data = await service.getPublicStudents();
  sendSuccess(res, data, "Students fetched");
};

exports.getById = async (req, res) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    return res.status(400).json({ message: "Invalid student id" });
  }

  const student = await service.getPublicStudent(id);
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }
  sendSuccess(res, student);
};

exports.sendEmail = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    return res.status(400).json({ message: "Invalid student id" });
  }

  const quota = await prepareMessagingQuota(req.user, "email");
  const payload = {
    sender_id: req.user.id,
    receiver_id: id,
    subject: req.body.subject,
    message: req.body.message,
  };
  if (quota && !quota.unlimited) {
    payload.quota = quota;
  }
  const data = await msgService.sendEmail(payload);
  sendSuccess(res, data, "Email sent");
});

exports.sendWhatsApp = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    return res.status(400).json({ message: "Invalid student id" });
  }

  const quota = await prepareMessagingQuota(req.user, "whatsapp");
  const payload = {
    sender_id: req.user.id,
    receiver_id: id,
    message: req.body.message,
  };
  if (quota && !quota.unlimited) {
    payload.quota = quota;
  }
  const data = await msgService.sendWhatsApp(payload);
  sendSuccess(res, data, "WhatsApp message sent");
});

exports.startVideoCall = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    return res.status(400).json({ message: "Invalid student id" });
  }

  const quota = await prepareMessagingQuota(req.user, "video");
  const payload = {
    sender_id: req.user.id,
    receiver_id: id,
  };
  if (quota && !quota.unlimited) {
    payload.quota = quota;
  }
  const data = await msgService.startVideoCall(payload);
  sendSuccess(res, data, "Video call started");
});
