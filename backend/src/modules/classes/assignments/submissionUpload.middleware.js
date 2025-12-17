const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const SUBMISSION_UPLOAD_SUBDIR = "assignment-submissions";
const uploadDir = path.join(
  __dirname,
  "../../../uploads",
  SUBMISSION_UPLOAD_SUBDIR
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${uuidv4()}`;
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!file?.mimetype) {
    return cb(new Error("Invalid file"), false);
  }
  if (allowedMimeTypes.has(file.mimetype)) {
    return cb(null, true);
  }
  return cb(
    new Error("Only PDF or Word documents are allowed for assignment uploads"),
    false
  );
};

const assignmentSubmissionUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = {
  assignmentSubmissionUpload,
  SUBMISSION_UPLOAD_SUBDIR,
};
