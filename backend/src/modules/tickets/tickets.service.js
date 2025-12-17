const ticketsModel = require("./tickets.model");

exports.createTicket = async (data) => {
  const [ticket] = await ticketsModel.create(data);
  return ticket;
};

exports.getAllTickets = (filters) => ticketsModel.findAll(filters);

exports.getTicketById = async (id) => {
  const ticket = await ticketsModel.findById(id);
  if (!ticket) return null;
  const messages = await ticketsModel.getMessages(id);
  return { ...ticket, messages };
};

exports.addMessage = async (ticketId, data) => {
  const [msg] = await ticketsModel.addMessage({ ticket_id: ticketId, ...data });
  return msg;
};

exports.addNote = async (ticketId, data) => {
  const [msg] = await ticketsModel.addMessage({
    ticket_id: ticketId,
    is_internal_note: true,
    ...data,
  });
  return msg;
};

exports.assignTicket = (ticketId, adminId) =>
  ticketsModel.update(ticketId, { assigned_admin_id: adminId });

exports.updateStatus = (ticketId, status) =>
  ticketsModel.update(ticketId, { status, updated_at: new Date() });

exports.updatePriority = (ticketId, priority) =>
  ticketsModel.update(ticketId, { priority, updated_at: new Date() });

exports.uploadAttachment = (messageId, file) =>
  ticketsModel.addAttachment({
    message_id: messageId,
    file_url: file.path,
    file_name: file.originalname,
  });
exports.deleteAttachment = async (attachmentId) => {
  const existing = await ticketsModel.findAttachmentById(attachmentId);
  if (!existing) return null;
  const [deleted] = await ticketsModel.deleteAttachment(attachmentId);
  return existing || deleted;
};
