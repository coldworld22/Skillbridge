const { z } = require("zod");

exports.sendEmail = {
  body: z.object({
    subject: z.string().trim().min(1),
    message: z.string().trim().min(1),
  }),
};

exports.sendWhatsApp = {
  body: z.object({
    message: z.string().trim().min(1),
  }),
};

exports.respondVideoCall = {
  body: z.object({
    action: z.enum(["accept", "decline"]),
  }),
};
