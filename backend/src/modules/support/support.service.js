const path = require("path");

const db = require("../../config/database");
const AppError = require("../../utils/AppError");
const { isAdminRole } = require("../../utils/role");

/**
 * Create a new support ticket and initial message
 * @param {Object} params
 * @param {string} params.user_id - ID of the user creating the ticket
 * @param {string} params.subject - Ticket subject
 * @param {string} params.message - Initial message content
 */
exports.createTicket = async ({ user_id, subject, message }) => {
  const normalizedSubject =
    typeof subject === "string" ? subject.trim() : "";
  if (!normalizedSubject) {
    throw new AppError("Subject is required", 400);
  }

  const normalizedMessage =
    typeof message === "string" ? message.trim() : "";
  if (!normalizedMessage) {
    throw new AppError("Message is required", 400);
  }

  return db.transaction(async (trx) => {
    // ─────────────────────
    // 🔢 Generate unique ticket number
    // ─────────────────────
    let ticketNumber;
    do {
      ticketNumber = Math.floor(100000 + Math.random() * 900000).toString();
    } while (
      await trx("support_tickets")
        .where({ ticket_number: ticketNumber })
        .first()
    );

    // ─────────────────────
    // 💾 Save the ticket
    // ─────────────────────
    const [ticket] = await trx("support_tickets")
      .insert({ user_id, subject: normalizedSubject, ticket_number: ticketNumber })
      .returning("*");

    await trx("support_messages").insert({
      ticket_id: ticket.id,
      sender_id: user_id,
      message: normalizedMessage,
    });

    return ticket;
  });
};

exports.listUserTickets = (user_id) => {
  return db("support_tickets")
    .where({ user_id })
    .orderBy("created_at", "desc");
};

exports.listAllTickets = ({ status, search, ticketNumber, priority } = {}) => {
  const query = db("support_tickets")
    .leftJoin("users", "support_tickets.user_id", "users.id")
    .select(
      "support_tickets.*",
      "users.email as user",
      "users.full_name as user_name",
      "users.avatar_url as user_avatar"
    )
    .orderBy("support_tickets.created_at", "desc");

  if (status) {
    query.where("support_tickets.status", status);
  }

  if (search) {
    query.where(function () {
      this.whereILike("support_tickets.subject", `%${search}%`)
        .orWhereILike("users.full_name", `%${search}%`)
        .orWhereILike("users.email", `%${search}%`);
    });
  }

  if (ticketNumber) {
    query.whereILike("support_tickets.ticket_number", `%${ticketNumber}%`);
  }

  if (priority) {
    query.where("support_tickets.priority", priority);
  }

  return query;
};

exports.getTicketById = async (id) => {
  const ticket = await db("support_tickets")
    .leftJoin("users", "support_tickets.user_id", "users.id")
    .select(
      "support_tickets.*",
      "users.email as user",
      "users.full_name as user_name",
      "users.avatar_url as user_avatar"
    )
    .where({ "support_tickets.id": id })
    .first();
  if (!ticket) return null;
  const messages = await db("support_messages")
    .leftJoin("users", "support_messages.sender_id", "users.id")
    .select(
      "support_messages.*",
      "users.full_name as sender_name",
      "users.avatar_url as sender_avatar"
    )
    .where({ ticket_id: id })
    .orderBy("support_messages.created_at", "asc");

  // Fetch attachments for all messages in a single query
  const ids = messages.map((m) => m.id);
  let attachmentsByMessage = {};
  if (ids.length) {
    const rows = await db("support_attachments").whereIn("message_id", ids);
    attachmentsByMessage = rows.reduce((acc, att) => {
      acc[att.message_id] = acc[att.message_id] || [];
      acc[att.message_id].push(att);
      return acc;
    }, {});
  }

  const messagesWithAttachments = messages.map((m) => ({
    ...m,
    attachments: attachmentsByMessage[m.id] || [],
  }));

  return { ...ticket, messages: messagesWithAttachments };
};

exports.addMessage = async ({ ticket_id, sender_id, message }) => {
  const [row] = await db("support_messages")
    .insert({ ticket_id, sender_id, message })
    .returning("*");
  return row;
};

// ─────────────────────
// 📎 Attachments helpers
// ─────────────────────

/**
 * Store an attachment linked to a support message
 * @param {Object} params
 * @param {string} params.message_id - Related support message ID
 * @param {string} params.file_url - Stored file path or URL
 * @param {string} [params.file_name] - Original filename
 */
exports.addAttachment = async ({ message_id, file_url, file_name }) => {
  const [row] = await db("support_attachments")
    .insert({ message_id, file_url, file_name })
    .returning("*");
  return row;
};

/**
 * Retrieve all attachments for a given message
 * @param {string} message_id
 */
exports.getAttachmentsByMessage = (message_id) =>
  db("support_attachments").where({ message_id });

/**
 * Upload and persist an attachment for a support message
 * @param {Object} params
 * @param {string} params.messageId - Target support message ID
 * @param {Object} params.file - Multer file object
 * @param {Object} params.user - Requesting user context
 */
exports.uploadAttachment = async ({ messageId, file, user }) => {
  const messageQuery = db("support_messages");
  const message = await messageQuery.where({ id: messageId }).first();

  if (!message) {
    throw new AppError("Support message not found", 404);
  }

  const ticketQuery = db("support_tickets");
  const ticket = await ticketQuery.where({ id: message.ticket_id }).first();

  if (!ticket) {
    throw new AppError("Support ticket not found", 404);
  }

  const hasAccess =
    (user?.id &&
      (ticket.user_id === user.id || message.sender_id === user.id)) ||
    isAdminRole(user?.roles || user?.role);

  if (!hasAccess) {
    throw new AppError("Access denied", 403);
  }

  const fileUrl = path.posix.join(
    "/uploads/support_attachments",
    file.filename
  );

  return exports.addAttachment({
    message_id: messageId,
    file_url: fileUrl,
    file_name: file.originalname || file.filename,
  });
};


exports.updateStatus = async (id, status) => {
  const [row] = await db("support_tickets")
    .where({ id })
    .update({ status, updated_at: db.fn.now() })
    .returning("*");
  return row;
};

exports.updatePriority = async (id, priority) => {
  const [row] = await db("support_tickets")
    .where({ id })
    .update({ priority, updated_at: db.fn.now() })
    .returning("*");
  return row;
};

exports.removeTicket = (id) =>
  db("support_tickets").where({ id }).del();

// Fetch recent support ticket activity for admin dashboard
exports.getRecentActivity = async (limit = 10) => {
  return db("support_tickets")
    .leftJoin("users", "support_tickets.user_id", "users.id")
    .select(
      "support_tickets.id",
      "support_tickets.subject",
      "support_tickets.status",
      "support_tickets.created_at",
      "users.full_name as user_name"
    )
    .orderBy("support_tickets.created_at", "desc")
    .limit(limit);
};

// ---------------------------------------------------------------------------
// 📊 Analytics for admin support dashboard
// ---------------------------------------------------------------------------

exports.getAnalytics = async () => {
  const [openRow] = await db("support_tickets").where({ status: "open" }).count();
  const [resolvedRow] = await db("support_tickets")
    .where({ status: "resolved" })
    .count();
  const [closedRow] = await db("support_tickets")
    .where({ status: "closed" })
    .count();

  const [avgRow] = await db("support_tickets")
    .whereNotNull("updated_at")
    .select(
      db.raw(
        "AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_hours"
      )
    );

  const chartRows = await db("support_tickets")
    .where("created_at", ">=", db.raw("CURRENT_DATE - INTERVAL '6 days'"))
    .select(db.raw("DATE(created_at) as day"))
    .count("* as tickets")
    .groupByRaw("DATE(created_at)")
    .orderBy("day");

  const lastWeek = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    lastWeek.push(d.toISOString().split("T")[0]);
  }
  const chartData = lastWeek.map((day) => {
    const row = chartRows.find((r) => {
      const rd = r.day instanceof Date ? r.day.toISOString().split("T")[0] : r.day;
      return rd === day;
    });
    return { day, tickets: row ? parseInt(row.tickets, 10) : 0 };
  });

  return {
    open: parseInt(openRow.count, 10) || 0,
    resolved: parseInt(resolvedRow.count, 10) || 0,
    closed: parseInt(closedRow.count, 10) || 0,
    avgHours: parseFloat(avgRow.avg_hours) || 0,
    chart: chartData,
  };
};

