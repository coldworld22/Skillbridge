const { z } = require("zod");

const uuidSchema = z.string().uuid({ message: "Invalid id format" });
const numericId = z
  .string()
  .trim()
  .regex(/^[0-9]+$/, { message: "Invalid id format" });

const idParams = z.object({
  id: z.union([uuidSchema, numericId]),
});

exports.idParam = {
  params: idParams,
};

exports.sendEmail = {
  params: idParams,
  body: z.object({
    subject: z.string().trim().min(1),
    message: z.string().trim().min(1),
  }),
};

exports.sendWhatsApp = {
  params: idParams,
  body: z.object({
    message: z.string().trim().min(1),
  }),
};

exports.startVideoCall = {
  params: idParams,
};

const callIdParams = z.object({
  id: z.string().trim().min(1, { message: "Invalid id format" }),
});

exports.respondVideoCall = {
  params: callIdParams,
  body: z.object({
    action: z.enum(["accept", "decline"]),
  }),
};

exports.endVideoCall = {
  params: callIdParams,
};
