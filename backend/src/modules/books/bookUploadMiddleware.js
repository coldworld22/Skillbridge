const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../../uploads/books');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const fileFilter = (_req, file, cb) => {
  const { fieldname, mimetype } = file;

  if (['cover_image', 'preview_pages'].includes(fieldname)) {
    if (imageTypes.includes(mimetype)) return cb(null, true);
    return cb(new Error('Invalid file type'), false);
  }

  if (fieldname === 'book_file') {
    if (mimetype === 'application/pdf') return cb(null, true);
    return cb(new Error('Invalid file type'), false);
  }

  return cb(new Error('Invalid file field'), false);
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
