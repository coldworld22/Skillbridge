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

const upload = multer({ storage });

module.exports = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]);
