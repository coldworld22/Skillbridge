const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../../uploads/books');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    try {
      // Store preview files under a dedicated subfolder so we can safely allow
      // serving preview PDFs without exposing full book files.
      const dir = file.fieldname === 'preview_pages'
        ? path.join(uploadDir, 'previews')
        : uploadDir;
      fs.mkdirSync(dir, { recursive: true });
      return cb(null, dir);
    } catch (err) {
      return cb(err);
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const hasAllowedImageExtension = (filename = '') => /\.(jpe?g|png|webp)$/i.test(filename);
const fileFilter = (_req, file, cb) => {
  const { fieldname, mimetype } = file;

  if (fieldname === 'cover_image') {
    if (imageTypes.includes(mimetype) && hasAllowedImageExtension(file.originalname)) {
      return cb(null, true);
    }
    const err = new Error('Cover image must be JPEG, PNG, or WEBP');
    err.status = 400;
    return cb(err, false);
  }

  if (fieldname === 'preview_pages') {
    if (imageTypes.includes(mimetype)) {
      return cb(null, true);
    }
    const err = new Error('Preview pages must be images (JPEG/PNG/WebP)');
    err.status = 400;
    return cb(err, false);
  }

  if (fieldname === 'book_file') {
    if (mimetype === 'application/pdf') return cb(null, true);
    const err = new Error('Book file must be a PDF');
    err.status = 400;
    return cb(err, false);
  }

  const err = new Error('Invalid file field');
  err.status = 400;
  return cb(err, false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
}).fields([
  { name: 'cover_image', maxCount: 1 },
  { name: 'book_file', maxCount: 1 },
  { name: 'preview_pages', maxCount: 10 },
]);

module.exports = upload;
module.exports.fileFilter = fileFilter;
