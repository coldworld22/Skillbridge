// 📁 modules/ads/adsUploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const imageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];
const videoTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
];

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

const fileFilter = (_req, file, cb) => {
  if (imageTypes.includes(file.mimetype) || videoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images or videos are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max per file
}).fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 },
]);

module.exports = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        const field = err.field === "image" ? "Image" : "Video";
        const limit = err.field === "image" ? "5MB" : "50MB";
        return next(new Error(`${field} exceeds ${limit} limit.`));
      }
      return next(err);
    }

    const image = req.files?.image?.[0];
    if (image && image.size > 5 * 1024 * 1024) {
      fs.unlink(image.path, () => {});
      return next(new Error("Image exceeds 5MB limit."));
    }

    next();
  });
};
