const { z } = require("zod");

exports.updateProgress = {
  body: z.object({
    progress: z.number().min(0).max(100),
  }),
};

exports.batchStatus = {
  body: z.object({
    tutorialIds: z.array(z.number()),
  }),
};

