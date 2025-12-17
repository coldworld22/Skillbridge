const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Resolve directory based on user role
const resolvePath = (req) => {
  const base = path.join(__dirname, "../../../../../uploads/tutorials/chapters");
  let role = req.user?.role?.toLowerCase() || "other";
  if (["superadmin", "admin"].includes(role)) role = "admin";
  const dir = path.join(base, role);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = resolvePath(req);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `chapter_${Date.now()}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const isVideo = file.mimetype.startsWith("video/");
  cb(null, isVideo);
};

const upload = multer({ storage, fileFilter });

module.exports = upload.single("video"); // use as middleware
