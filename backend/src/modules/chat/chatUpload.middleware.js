const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../../uploads/chat');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const fileTypes = {
    file: ["image/jpeg", "image/png", "application/pdf"],
    audio: ["audio/mpeg", "audio/wav", "audio/webm", "audio/ogg"],
  };
  const allowed = fileTypes[file.fieldname] || [];
  const matches = allowed.some((type) => file.mimetype === type || file.mimetype?.startsWith(`${type};`));
  if (matches) return cb(null, true);
  const err = new Error("Invalid file type");
  err.status = 400;
  cb(err);
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

module.exports = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]);
