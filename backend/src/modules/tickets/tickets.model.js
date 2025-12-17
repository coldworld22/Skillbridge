const db = require("../../config/database");

exports.create = (data) => db("tickets").insert(data).returning("*");
exports.findAll = (filters = {}) => {
  let query = db("tickets");
  if (filters.status) query.where("status", filters.status);
  if (filters.priority) query.where("priority", filters.priority);
  return query.orderBy("created_at", "desc");
};
exports.findById = (id) => db("tickets").where({ id }).first();
exports.update = (id, data) =>
  db("tickets").where({ id }).update(data).returning("*");

exports.addMessage = (message) =>
  db("ticket_messages").insert(message).returning("*");
exports.getMessages = (ticket_id) =>
  db("ticket_messages").where({ ticket_id }).orderBy("created_at");
exports.addAttachment = (attachment) =>
  db("ticket_attachments").insert(attachment).returning("*");
exports.getAttachmentsByMessage = (message_id) =>
  db("ticket_attachments").where({ message_id });
exports.addTag = (tag) => db("ticket_tags").insert(tag).returning("*");
exports.getTags = (ticket_id) => db("ticket_tags").where({ ticket_id });
exports.findAttachmentById = (id) =>
  db("ticket_attachments").where({ id }).first();
exports.deleteAttachment = (id) =>
  db("ticket_attachments").where({ id }).del().returning("*");
