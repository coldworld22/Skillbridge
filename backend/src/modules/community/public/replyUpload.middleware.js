const multer = require('multer');
const path = require('path');
const fs = require('fs');

const allowed = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
];
const uploadDir = path.join(__dirname, '../../../../uploads/community');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  cb(null, allowed.includes(file.mimetype));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
]);
