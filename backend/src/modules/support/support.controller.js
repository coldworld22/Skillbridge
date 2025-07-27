const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./support.service");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");

const isAdminRole = (roles = []) => {
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr
    .map((r) => r.toLowerCase().replace(/\s+/g, ""))
    .some((r) => ["admin", "superadmin"].includes(r));
};

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

exports.listAllTickets = catchAsync(async (req, res) => {
  const filters = {
    status: req.query.status,
    search: req.query.search,
  };
  const tickets = await service.listAllTickets(filters);
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
  if (ticket.user_id !== req.user.id && !isAdminRole(req.user.roles || req.user.role)) {
    throw new AppError("Access denied", 403);
  }
  const msg = await service.addMessage({
    ticket_id: req.params.id,
    sender_id: req.user.id,
    message: req.body.message,
  });
  if (isAdminRole(req.user.roles || req.user.role) && ticket.user_id !== req.user.id) {
    await notificationService.createNotification({
      user_id: ticket.user_id,
      type: "support_reply",
      message: `Your ticket '${ticket.subject}' has a new reply`,
    });
    await messageService.createMessage({
      sender_id: req.user.id,
      receiver_id: ticket.user_id,
      message: `Your ticket '${ticket.subject}' has a new reply`,
    });
  }
  sendSuccess(res, msg, "Message added");
});

exports.updateStatus = catchAsync(async (req, res) => {
  const ticket = await service.updateStatus(req.params.id, req.body.status);
  if (!ticket) throw new AppError("Ticket not found", 404);
  if (isAdminRole(req.user.roles || req.user.role) && ticket.user_id !== req.user.id) {
    await notificationService.createNotification({
      user_id: ticket.user_id,
      type: "ticket_status",
      message: `Your ticket '${ticket.subject}' was ${req.body.status}`,
    });
    await messageService.createMessage({
      sender_id: req.user.id,
      receiver_id: ticket.user_id,
      message: `Your ticket '${ticket.subject}' was ${req.body.status}`,
    });
  }
  sendSuccess(res, ticket, "Status updated");
});
