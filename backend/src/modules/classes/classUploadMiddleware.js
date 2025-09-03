const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sanitize = require('sanitize-filename');
const mime = require('mime-types');

const uploadDir = path.join(__dirname, '../../../uploads/classes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const generateFilename = (originalname) => {
  const ext = path.extname(originalname);
  const base = sanitize(path.basename(originalname, ext))
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9+_.-]/g, '');
  return `${Date.now()}-${base}${ext}`;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    cb(null, generateFilename(file.originalname));
  },
});

const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const videoTypes = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm'];

const fileFilter = (_req, file, cb) => {
  const detectedMime = mime.lookup(file.originalname) || '';

  if (file.fieldname === 'cover_image') {
    if (imageTypes.includes(file.mimetype) && imageTypes.includes(detectedMime))
      return cb(null, true);
    return cb(new Error('Invalid file type'), false);
  } else if (file.fieldname === 'demo_video') {
    if (videoTypes.includes(file.mimetype) && videoTypes.includes(detectedMime))
      return cb(null, true);
    return cb(new Error('Invalid file type'), false);
  }

  return cb(new Error('Invalid file field'), false);
};

const upload = multer({
  storage,
  fileFilter,
  // Allow larger video uploads for demo videos and bigger text fields
  limits: { fileSize: 500 * 1024 * 1024, fieldSize: 25 * 1024 * 1024 },
}).fields([
  { name: 'cover_image', maxCount: 1 },
  { name: 'demo_video', maxCount: 1 },
]);

module.exports = upload;
module.exports.fileFilter = fileFilter;
module.exports.storage = storage;
module.exports.generateFilename = generateFilename;
