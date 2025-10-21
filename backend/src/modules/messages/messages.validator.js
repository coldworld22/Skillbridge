const { z } = require("zod");

const idParams = z.object({
  id: z
    .string()
    .trim()
    .uuid({ message: "Invalid id format" }),
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

exports.respondVideoCall = {
  params: idParams,
  body: z.object({
    action: z.enum(["accept", "decline"]),
  }),
};

exports.endVideoCall = {
  params: idParams,
};
