// 📁 src/modules/users/tutorials/tutorialUploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads/tutorials folder exists
const uploadPath = path.join(__dirname, "../../../../uploads/tutorials");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${base}-${timestamp}${ext}`);
  },
});

// Optional: strict file type filter
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "video/mp4", "video/webm"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type"), false);
  }
  cb(null, true);
};

module.exports = multer({ storage, fileFilter });
