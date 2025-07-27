const service = require('./tickets.service');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/response');

exports.createTicket = catchAsync(async (req, res) => {
  const ticket = await service.createTicket({
    subject: req.body.subject,
    description: req.body.description,
    user_id: req.user.id,
  });
  sendSuccess(res, ticket, 'Ticket created');
});

exports.getAllTickets = catchAsync(async (req, res) => {
  const tickets = await service.getAllTickets(req.query);
  sendSuccess(res, tickets);
});

exports.getTicketById = catchAsync(async (req, res) => {
  const data = await service.getTicketById(req.params.id);
  if (!data) throw new AppError('Ticket not found', 404);
  sendSuccess(res, data);
});

exports.addMessage = catchAsync(async (req, res) => {
  const msg = await service.addMessage(req.params.id, {
    sender_id: req.user.id,
    message: req.body.message,
  });
  sendSuccess(res, msg, 'Message added');
});

exports.addNote = catchAsync(async (req, res) => {
  const msg = await service.addNote(req.params.id, {
    sender_id: req.user.id,
    message: req.body.message,
  });
  sendSuccess(res, msg, 'Note added');
});

exports.updateStatus = catchAsync(async (req, res) => {
  const [ticket] = await service.updateStatus(req.params.id, req.body.status);
  if (!ticket) throw new AppError('Ticket not found', 404);
  sendSuccess(res, ticket, 'Status updated');
});

exports.updatePriority = catchAsync(async (req, res) => {
  const [ticket] = await service.updatePriority(req.params.id, req.body.priority);
  if (!ticket) throw new AppError('Ticket not found', 404);
  sendSuccess(res, ticket, 'Priority updated');
});

exports.assignTicket = catchAsync(async (req, res) => {
  const [ticket] = await service.assignTicket(req.params.id, req.body.adminId);
  if (!ticket) throw new AppError('Ticket not found', 404);
  sendSuccess(res, ticket, 'Ticket assigned');
});

exports.uploadAttachment = catchAsync(async (req, res) => {
  const file = req.file;
  if (!file) throw new AppError('No file uploaded', 400);
  const attachment = await service.uploadAttachment(req.params.messageId, file);
  sendSuccess(res, attachment, 'Attachment uploaded');
});
