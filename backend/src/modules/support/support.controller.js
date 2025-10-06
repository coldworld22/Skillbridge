const logger = require('../../utils/logger.js');
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./support.service");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const userModel = require("../users/user.model");
const {
  sendSupportTicketAdminEmail,
  sendSupportTicketUserEmail,
  sendSupportTicketUpdateEmail,
} = require("../../utils/email");


const isAdminRole = (roles = []) => {
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr
    .map((r) => r.toLowerCase().replace(/\s+/g, ""))
    .some((r) => ["admin", "superadmin"].includes(r));
};

/**
 * Create a support ticket for the current user
 * Sends email notifications to the user and admins
 */
exports.createTicket = catchAsync(async (req, res) => {
  const ticket = await service.createTicket({
    user_id: req.user.id,
    subject: req.body.subject,
    message: req.body.message,
  });

  // ─────────────────────
  // 📣 Notify admins and user
  // ─────────────────────
  const admins = await userModel.findAdmins();
  const adminEmailResults = await Promise.allSettled(
    admins.map((a) =>
      sendSupportTicketAdminEmail(
        a.email,
        req.user.full_name,
        ticket.subject,
        ticket.ticket_number
      )
    )
  );
  adminEmailResults.forEach((r) => {
    if (r.status === "rejected") {
      logger.error(
        "Failed to send admin support email:",
        r.reason?.message || r.reason
      );
    }
  });

  try {
    await sendSupportTicketUserEmail(
      req.user.email,
      req.user.full_name,
      ticket.subject,
      ticket.ticket_number
    );
  } catch (err) {
    logger.error("Failed to send user support email:", err.message);
  }

  const adminNotifyResults = await Promise.allSettled(
    admins.map((admin) =>
      notificationService.createNotification({
        user_id: admin.id,
        type: "new_support_ticket",
        message: `New support ticket from ${req.user.full_name}: '${ticket.subject}'`,
      })
    )
  );
  adminNotifyResults.forEach((r, idx) => {
    if (r.status === "rejected") {
      logger.error(
        `Failed to notify admin ${admins[idx].id} of support ticket:`,
        r.reason?.message || r.reason
      );
    }
  });

  const adminMessageResults = await Promise.allSettled(
    admins.map((admin) =>
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: admin.id,
        message: `New support ticket '${ticket.subject}' submitted`,
      })
    )
  );
  adminMessageResults.forEach((r, idx) => {
    if (r.status === "rejected") {
      logger.error(
        `Failed to message admin ${admins[idx].id} about support ticket:`,
        r.reason?.message || r.reason
      );
    }
  });

  const userDispatch = await Promise.allSettled([
    notificationService.createNotification({
      user_id: req.user.id,
      type: "ticket_submitted",
      message: `Ticket #${ticket.ticket_number} created`,
    }),
    messageService.createMessage({
      sender_id: req.user.id,
      receiver_id: req.user.id,
      message: `We received your support ticket #${ticket.ticket_number}`,
    }),
  ]);
  userDispatch.forEach((r) => {
    if (r.status === "rejected") {
      logger.error(
        "Failed to dispatch user notification/message for ticket creation:",
        r.reason?.message || r.reason
      );
    }
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
    ticketNumber: req.query.ticketNumber,
    priority: req.query.priority,
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
    try {
      const user = await userModel.findById(ticket.user_id);
      if (user)
        await sendSupportTicketUpdateEmail(
          user.email,
          user.full_name,
          ticket.subject,
          "Your support ticket has a new reply."
        );
    } catch (err) {
      logger.error("Error sending ticket reply email:", err.message);
    }
  }
  sendSuccess(res, msg, "Message added");
});

exports.uploadAttachment = catchAsync(async (req, res, next) => {
  const file = req.file;
  if (!file) throw new AppError("No file uploaded", 400);
  try {
    const attachment = await service.uploadAttachment({
      messageId: req.params.messageId,
      file,
      user: req.user,
    });
    sendSuccess(res, attachment, "Attachment uploaded");
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    throw error;
  }
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
    try {
      const user = await userModel.findById(ticket.user_id);
      if (user)
        await sendSupportTicketUpdateEmail(
          user.email,
          user.full_name,
          ticket.subject,
          `Your support ticket was ${req.body.status}.`
        );
    } catch (err) {
      logger.error("Error sending ticket status email:", err.message);
    }
  }
  sendSuccess(res, ticket, "Status updated");
});

exports.updatePriority = catchAsync(async (req, res) => {
  const ticket = await service.updatePriority(
    req.params.id,
    req.body.priority
  );
  if (!ticket) throw new AppError("Ticket not found", 404);
  sendSuccess(res, ticket, "Priority updated");
});

exports.deleteTicket = catchAsync(async (req, res) => {
  const ticket = await service.getTicketById(req.params.id);
  if (!ticket) throw new AppError("Ticket not found", 404);
  if (
    ticket.user_id !== req.user.id &&
    !isAdminRole(req.user.roles || req.user.role)
  ) {
    throw new AppError("Access denied", 403);
  }
  if (!["resolved", "closed"].includes(ticket.status.toLowerCase())) {
    throw new AppError(
      "Only resolved or closed tickets can be deleted",
      400
    );
  }
  await service.removeTicket(req.params.id);
  sendSuccess(res, null, "Ticket deleted");
});

exports.listRecentActivity = catchAsync(async (_req, res) => {
  const data = await service.getRecentActivity();
  sendSuccess(res, data);
});

exports.getAnalytics = catchAsync(async (_req, res) => {
  const data = await service.getAnalytics();
  sendSuccess(res, data);
});

