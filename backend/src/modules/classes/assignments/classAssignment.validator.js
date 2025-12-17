const { z } = require("zod");

const questionSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().min(1).max(2000),
  options: z.array(z.string().min(1)).min(2).max(10).optional(),
  correct: z.number().int().min(0).optional(),
  points: z.number().int().min(1).max(100).optional(),
});

const resourceSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1).max(120),
  url: z.string().url(),
});

const sharedOptionalFields = {
  description: z.string().max(5000).optional(),
  type: z.enum(["mcq", "text", "code", "file"]).optional(),
  allow_late: z.boolean().optional(),
  time_to_finish: z.string().max(64).optional(),
  language: z.string().max(64).optional(),
  starter_code: z.string().optional(),
  grading_rubric: z.string().max(8000).optional(),
  questions: z.array(questionSchema).max(50).optional(),
  supporting_resources: z.array(resourceSchema).max(12).optional(),
  settings: z.record(z.any()).optional(),
};

exports.create = {
  body: z.object({
    title: z.string().min(3),
    due_date: z.string().date(),
    ...sharedOptionalFields,
  }),
};

exports.update = {
  body: z.object({
    title: z.string().min(3).optional(),
    due_date: z.string().date().optional(),
    ...sharedOptionalFields,
  }),
};
