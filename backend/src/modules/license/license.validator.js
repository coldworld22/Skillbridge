const { z } = require('zod');

exports.activate = z.object({
  body: z.object({
    purchase_code: z.string().min(1),
    domain: z.string().min(1),
    email: z.string().email(),
    ip: z.string().optional(),
  }),
});

exports.validate = z.object({
  body: z.object({
    purchase_code: z.string().min(1),
    domain: z.string().min(1),
    ip: z.string().optional(),
  }),
});

exports.deactivate = z.object({
  body: z.object({
    purchase_code: z.string().min(1),
    domain: z.string().min(1),
  }),
});
