const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sanitize = require("sanitize-filename");

const uploadDir = path.join(__dirname, "../../../uploads/class-resources");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const generateFilename = (originalname) => {
  const ext = path.extname(originalname);
  const base = sanitize(path.basename(originalname, ext))
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9+_.-]/g, "");
  return `${Date.now()}-${base}${ext}`;
};

const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, generateFilename(file.originalname)),
});

const fileFilter = (_req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }
  return cb(new Error("Unsupported file type"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = upload;
