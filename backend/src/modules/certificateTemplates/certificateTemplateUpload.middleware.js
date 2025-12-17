const logger = require('../../utils/logger.js');
const multer = require("multer");
const path = require("path");
const fsPromises = require("fs/promises");

const uploadDir = path.join(__dirname, "../../../uploads/certificateTemplates");

(async () => {
  try {
    await fsPromises.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    logger.error("Error creating upload directory:", error);
    throw error;
  }
})();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const fileFilter = (_req, file, cb) => {
  if (imageTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type. Only images are allowed."), false);
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single("file");
