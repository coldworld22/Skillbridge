const { z } = require("zod");

const issue = {
  body: z.object({
    classId: z.string().uuid(),
    studentId: z.string().uuid(),
    studentName: z.string().trim().min(3).max(160).optional(),
    issueDate: z.string().date().optional(),
    templateId: z.string().uuid().optional(),
    platformName: z.string().trim().max(160).optional(),
    instructorName: z.string().trim().max(160).optional(),
    grade: z.union([z.string(), z.number()]).optional(),
    verificationUrl: z.string().url().optional(),
  }),
};

module.exports = {
  issue,
};
