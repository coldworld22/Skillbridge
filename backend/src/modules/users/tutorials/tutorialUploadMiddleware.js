// 📁 src/modules/users/tutorials/tutorialUploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
];

const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PREVIEW_SIZE = 100 * 1024 * 1024; // 100MB

// Helper to determine base directory based on user role
const resolveUploadPath = (req) => {
  const base = path.join(__dirname, "../../../../uploads/tutorials");
  let role = req.user?.role?.toLowerCase() || "other";
  if (["superadmin", "admin"].includes(role)) role = "admin";
  const roleDir = path.join(base, role);
  if (!fs.existsSync(roleDir)) fs.mkdirSync(roleDir, { recursive: true });
  return roleDir;
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = resolveUploadPath(req);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${base}-${timestamp}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const detectedMime = mime.lookup(file.originalname) || "";
  if (file.fieldname === "thumbnail") {
    if (IMAGE_TYPES.includes(file.mimetype) && IMAGE_TYPES.includes(detectedMime)) {
      return cb(null, true);
    }
    return cb(new Error("Invalid thumbnail file type"), false);
  }
  if (file.fieldname === "preview") {
    if (VIDEO_TYPES.includes(file.mimetype) && VIDEO_TYPES.includes(detectedMime)) {
      return cb(null, true);
    }
    return cb(new Error("Invalid preview file type"), false);
  }
  return cb(new Error("Invalid file field"), false);
};

const baseUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_PREVIEW_SIZE },
});

module.exports = (req, res, next) => {
  baseUpload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "preview", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return next(err);
    const thumb = req.files?.thumbnail?.[0];
    const preview = req.files?.preview?.[0];
    if (thumb && thumb.size > MAX_THUMBNAIL_SIZE) {
      fs.unlink(thumb.path, () => {});
      return next(new Error("Thumbnail file too large"));
    }
    if (preview && preview.size > MAX_PREVIEW_SIZE) {
      fs.unlink(preview.path, () => {});
      return next(new Error("Preview file too large"));
    }
    next();
  });
};

module.exports.storage = storage;
module.exports.fileFilter = fileFilter;
module.exports.MAX_THUMBNAIL_SIZE = MAX_THUMBNAIL_SIZE;
module.exports.MAX_PREVIEW_SIZE = MAX_PREVIEW_SIZE;
