const { z } = require("zod");

exports.submit = {
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    message: z.string().min(1),
  }),
};
