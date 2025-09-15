const multer = require("multer");
const path = require("path");
const fs = require("fs");

const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const uploadDir = path.join(__dirname, "../../../uploads/blog");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type. Only images are allowed."), false);
};

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const envMax = Number(process.env.MAX_BLOG_IMAGE_BYTES);
const maxFileSize =
  Number.isInteger(envMax) && envMax > 0 && envMax <= 20 * 1024 * 1024
    ? envMax
    : DEFAULT_MAX_SIZE;

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxFileSize },
});
