const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure directory exists
const uploadPath = path.join(__dirname, "../../../../../uploads/tutorials/chapters");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `chapter_${Date.now()}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const isVideo = file.mimetype.startsWith("video/");
  cb(null, isVideo);
};

const upload = multer({ storage, fileFilter });

module.exports = upload.single("video"); // use as middleware
