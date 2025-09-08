// 📁 middleware/videoUploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ───────────────────────────────────────────────
// 📂 Ensure demo-videos directory exists
// ───────────────────────────────────────────────
const demoVideoDir = path.join(__dirname, "../uploads/demo-videos");
if (!fs.existsSync(demoVideoDir)) {
  fs.mkdirSync(demoVideoDir, { recursive: true });
}

// ───────────────────────────────────────────────
// 🎥 Multer Storage for Video Uploads
// - Stores file in demo-videos folder
// - Filenames are: instructor-<userId>-timestamp.ext
// ───────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, demoVideoDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `instructor-${req.user.id}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

// ───────────────────────────────────────────────
// 🛡 Filter to Allow Only Video Files
// ───────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only video files are allowed."), false);
  }
};

// ───────────────────────────────────────────────
// 🚀 Export Configured Multer Middleware
// - Limits file size to 100MB
// ───────────────────────────────────────────────
const uploadVideo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

module.exports = uploadVideo;
