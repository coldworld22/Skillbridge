const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ────── Avatar Upload ──────
const avatarDir = path.join(__dirname, "../../../../uploads/avatars/student");
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `student-avatar-${req.params.id || Date.now()}${ext}`);
  },
});

const avatarFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// ────── Identity Document Upload ──────
const identityDir = path.join(__dirname, "../../../../uploads/identity/student");
if (!fs.existsSync(identityDir)) fs.mkdirSync(identityDir, { recursive: true });

const identityStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, identityDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `student-id-${req.params.id || Date.now()}${ext}`);
  },
});

const identityFileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"), false);
};

const identityUpload = multer({
  storage: identityStorage,
  fileFilter: identityFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = {
  avatarUpload,
  identityUpload,
};
