// 📁 src/modules/users/instructor/instructorUploadMiddleware.js

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ──────────────── Utilities ────────────────
const createDirIfNotExist = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// ──────────────── Avatar Upload ────────────────
const avatarDir = path.join(__dirname, "../../../../uploads/avatars/instructor");
createDirIfNotExist(avatarDir);

const avatarStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `instructor-avatar-${req.params.id || Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// ──────────────── Demo Video Upload ────────────────
const demoDir = path.join(__dirname, "../../../../uploads/demos/instructor");
createDirIfNotExist(demoDir);

const demoStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, demoDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `instructor-demo-${req.params.id || Date.now()}${ext}`);
  },
});

const demoUpload = multer({
  storage: demoStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) cb(null, true);
    else cb(new Error("Only video files are allowed"), false);
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// ──────────────── Certificate Upload ────────────────
const certDir = path.join(__dirname, "../../../../uploads/certificates/instructor");
createDirIfNotExist(certDir);

const certStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, certDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const certificateUpload = multer({
  storage: certStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF or image files are allowed"), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ──────────────── Exports ────────────────
module.exports = {
  avatarUpload,
  demoUpload,
  certificateUpload,
};
