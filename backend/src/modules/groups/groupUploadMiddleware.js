const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../../uploads/groups');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const sanitizeName = (name) =>
  name
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9+_.-]/g, '');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = sanitizeName(path.basename(file.originalname, ext));
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const fileFilter = (_req, file, cb) => {
  if (file.fieldname === 'cover_image') {
    cb(null, imageTypes.includes(file.mimetype));
  } else {
    cb(null, false);
  }
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('cover_image');
