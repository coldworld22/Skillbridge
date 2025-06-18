// 📁 modules/ads/adsUploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

// Directory: /backend/uploads/ads
const uploadDir = path.join(__dirname, "../../../uploads/ads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type. Only images are allowed."), false);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});
