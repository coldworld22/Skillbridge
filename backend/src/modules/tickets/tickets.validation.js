const { z } = require('zod');
const { STATUS, PRIORITY } = require('./tickets.constants');

exports.createTicketSchema = z.object({
  subject: z.string().min(1),
  description: z.string().min(1),
});

exports.replySchema = z.object({
  message: z.string().min(1),
});

exports.statusSchema = z.object({
  status: z.enum(STATUS),
});

exports.prioritySchema = z.object({
  priority: z.enum(PRIORITY),
});

exports.assignSchema = z.object({
  adminId: z.number().int(),
});
