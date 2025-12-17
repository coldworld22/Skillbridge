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

const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic', 'image/heif', 'image/avif'];
const videoTypes = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm', 'video/x-msvideo', 'video/mpeg'];
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif'];
const videoExtensions = ['.mp4', '.mov', '.mkv', '.webm', '.avi', '.mpeg', '.mpg'];

// Allow either an exact MIME match or a known extension match to prevent false negatives
const hasAllowedType = (allowedTypes, ...values) =>
  values
    .filter(Boolean)
    .map((v) => v.toLowerCase())
    .some((v) => allowedTypes.includes(v));

const fileFilter = (_req, file, cb) => {
  const detectedMime = mime.lookup(file.originalname) || '';
  const extension = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'cover_image') {
    if (
      hasAllowedType(imageTypes, file.mimetype, detectedMime) ||
      imageExtensions.includes(extension)
    )
      return cb(null, true);
    return cb(new Error('Invalid file type'), false);
  } else if (file.fieldname === 'demo_video') {
    if (
      hasAllowedType(videoTypes, file.mimetype, detectedMime) ||
      videoExtensions.includes(extension)
    )
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
