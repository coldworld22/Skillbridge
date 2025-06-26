const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../../../uploads/lessons');
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

const uploader = multer({ storage }).fields([
  { name: 'lesson_topic', maxCount: 1 },
  { name: 'resource', maxCount: 1 },
]);

module.exports = (req, res, next) => {
  uploader(req, res, (err) => {
    if (err) return next(err);
    if (req.files?.lesson_topic?.[0]) {
      req.file = req.files.lesson_topic[0];
    } else if (req.files?.resource?.[0]) {
      req.file = req.files.resource[0];
    }
    next();
  });
};
