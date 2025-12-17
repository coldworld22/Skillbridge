const service = require("./tickets.service");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const fs = require("fs");
const path = require("path");
const { subtractStorageUsage } = require("../../middleware/storage");

exports.createTicket = catchAsync(async (req, res) => {
  const ticket = await service.createTicket({
    subject: req.body.subject,
    description: req.body.description,
    user_id: req.user.id,
  });
  sendSuccess(res, ticket, "Ticket created");
});

exports.getAllTickets = catchAsync(async (req, res) => {
  const tickets = await service.getAllTickets(req.query);
  sendSuccess(res, tickets);
});

exports.getTicketById = catchAsync(async (req, res) => {
  const data = await service.getTicketById(req.params.id);
  if (!data) throw new AppError("Ticket not found", 404);
  sendSuccess(res, data);
});

exports.addMessage = catchAsync(async (req, res) => {
  const msg = await service.addMessage(req.params.id, {
    sender_id: req.user.id,
    message: req.body.message,
  });
  sendSuccess(res, msg, "Message added");
});

exports.addNote = catchAsync(async (req, res) => {
  const msg = await service.addNote(req.params.id, {
    sender_id: req.user.id,
    message: req.body.message,
  });
  sendSuccess(res, msg, "Note added");
});

exports.updateStatus = catchAsync(async (req, res) => {
  const [ticket] = await service.updateStatus(req.params.id, req.body.status);
  if (!ticket) throw new AppError("Ticket not found", 404);
  sendSuccess(res, ticket, "Status updated");
});

exports.updatePriority = catchAsync(async (req, res) => {
  const [ticket] = await service.updatePriority(
    req.params.id,
    req.body.priority,
  );
  if (!ticket) throw new AppError("Ticket not found", 404);
  sendSuccess(res, ticket, "Priority updated");
});

exports.assignTicket = catchAsync(async (req, res) => {
  const [ticket] = await service.assignTicket(req.params.id, req.body.adminId);
  if (!ticket) throw new AppError("Ticket not found", 404);
  sendSuccess(res, ticket, "Ticket assigned");
});

exports.uploadAttachment = catchAsync(async (req, res) => {
  const file = req.file;
  if (!file) throw new AppError("No file uploaded", 400);
  const attachment = await service.uploadAttachment(req.params.messageId, file);
  sendSuccess(res, attachment, "Attachment uploaded");
});

exports.deleteAttachment = catchAsync(async (req, res) => {
  const attachment = await service.deleteAttachment(req.params.attachmentId);
  if (!attachment) throw new AppError("Attachment not found", 404);
  if (attachment?.file_path) {
    const filePath = path.join(__dirname, "../../..", attachment.file_path);
    if (fs.existsSync(filePath)) {
      const size = fs.statSync(filePath)?.size || 0;
      fs.unlinkSync(filePath);
      if (req.tenant?.id && size > 0) {
        await subtractStorageUsage(req.tenant.id, size);
      }
    }
  }
  sendSuccess(res, null, "Attachment deleted");
});
