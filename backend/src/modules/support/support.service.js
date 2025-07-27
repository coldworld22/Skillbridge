const db = require("../../config/database");

exports.createTicket = async ({ user_id, subject, message }) => {
  const [ticket] = await db("support_tickets")
    .insert({ user_id, subject })
    .returning("*");
  await db("support_messages").insert({
    ticket_id: ticket.id,
    sender_id: user_id,
    message,
  });
  return ticket;
};

exports.listUserTickets = (user_id) => {
  return db("support_tickets")
    .where({ user_id })
    .orderBy("created_at", "desc");
};

exports.listAllTickets = () => {
  return db("support_tickets")
    .leftJoin("users", "support_tickets.user_id", "users.id")
    .select("support_tickets.*", "users.email as user")
    .orderBy("support_tickets.created_at", "desc");
};

exports.getTicketById = async (id) => {
  const ticket = await db("support_tickets")
    .leftJoin("users", "support_tickets.user_id", "users.id")
    .select("support_tickets.*", "users.email as user")
    .where({ "support_tickets.id": id })
    .first();
  if (!ticket) return null;
  const messages = await db("support_messages")
    .where({ ticket_id: id })
    .orderBy("created_at", "asc");
  return { ...ticket, messages };
};

exports.addMessage = async ({ ticket_id, sender_id, message }) => {
  const [row] = await db("support_messages")
    .insert({ ticket_id, sender_id, message })
    .returning("*");
  return row;
};

exports.updateStatus = async (id, status) => {
  const [row] = await db("support_tickets")
    .where({ id })
    .update({ status, updated_at: db.fn.now() })
    .returning("*");
  return row;
};
