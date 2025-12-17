const { z } = require("zod");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const fileTypes = ["image/jpeg", "image/png", "application/pdf"];
const audioTypes = ["audio/mpeg", "audio/wav", "audio/webm", "audio/ogg"];

const baseUploadSchema = z.object({
  mimetype: z.string(),
  size: z.number(),
});

const fileSchema = baseUploadSchema
  .extend({
    mimetype: z.enum(fileTypes),
  })
  .refine((f) => f.size <= MAX_FILE_SIZE, {
    message: "File too large",
  });

const audioSchema = baseUploadSchema.extend({
  mimetype: z
    .string()
    .refine(
      (type) => audioTypes.some((allowed) => type === allowed || type.startsWith(`${allowed};`)),
      {
        message: "Unsupported audio format",
      }
    ),
}).refine((f) => f.size <= MAX_FILE_SIZE, {
  message: "File too large",
});

exports.sendMessage = {
  body: z
    .object({
      message: z.string().trim().min(1, "Message cannot be empty").optional(),
      file: fileSchema.optional(),
      audio: audioSchema.optional(),
      replyTo: z.string().optional(),
    })
    .refine(
      (data) =>
        !!(data.message && data.message.trim()) ||
        !!data.file ||
        !!data.audio,
      {
        message: "Message or attachment required",
        path: ["message"],
      }
    )
    .refine((data) => !(data.file && data.audio), {
      message: "Only one attachment allowed",
      path: ["file"],
    }),
};

exports.logModerationEvent = {
  body: z.object({
    message: z.string().min(1),
    matchedWords: z.array(z.string()).nonempty(),
  }),
};
