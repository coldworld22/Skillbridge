const { z } = require("zod");

// Keep the `id` parameter as a string so downstream services receive it in
// its original form. Allow any non-empty string since some routes (like
// video call IDs) use alphanumeric identifiers.
const idParams = z.object({
  id: z.string().trim().min(1),
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
