const { z } = require("zod");

exports.create = z.object({
  body: z.object({
    name: z.string().min(1),
  }),
});
