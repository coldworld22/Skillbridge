const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./support.service");

exports.createTicket = catchAsync(async (req, res) => {
  const ticket = await service.createTicket({
    user_id: req.user.id,
    subject: req.body.subject,
    message: req.body.message,
  });
  sendSuccess(res, ticket, "Ticket created");
});

exports.listMyTickets = catchAsync(async (req, res) => {
  const tickets = await service.listUserTickets(req.user.id);
  sendSuccess(res, tickets);
});

exports.listAllTickets = catchAsync(async (_req, res) => {
  const tickets = await service.listAllTickets();
  sendSuccess(res, tickets);
});

exports.getTicket = catchAsync(async (req, res) => {
  const data = await service.getTicketById(req.params.id);
  if (!data) throw new AppError("Ticket not found", 404);
  sendSuccess(res, data);
});

exports.addMessage = catchAsync(async (req, res) => {
  const ticket = await service.getTicketById(req.params.id);
  if (!ticket) throw new AppError("Ticket not found", 404);
  if (ticket.user_id !== req.user.id && !req.user.roles.includes("admin")) {
    throw new AppError("Access denied", 403);
  }
  const msg = await service.addMessage({
    ticket_id: req.params.id,
    sender_id: req.user.id,
    message: req.body.message,
  });
  sendSuccess(res, msg, "Message added");
});

exports.updateStatus = catchAsync(async (req, res) => {
  const ticket = await service.updateStatus(req.params.id, req.body.status);
  if (!ticket) throw new AppError("Ticket not found", 404);
  sendSuccess(res, ticket, "Status updated");
});
