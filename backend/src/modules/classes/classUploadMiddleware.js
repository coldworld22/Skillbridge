const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../../uploads/classes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const videoTypes = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm'];

const fileFilter = (_req, file, cb) => {
  if (file.fieldname === 'cover_image') {
    cb(null, imageTypes.includes(file.mimetype));
  } else if (file.fieldname === 'demo_video') {
    cb(null, videoTypes.includes(file.mimetype));
  } else {
    cb(null, false);
  }
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } }).fields([
  { name: 'cover_image', maxCount: 1 },
  { name: 'demo_video', maxCount: 1 },
]);
