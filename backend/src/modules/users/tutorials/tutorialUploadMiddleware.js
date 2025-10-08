// 📁 src/modules/users/tutorials/tutorialUploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Helper to determine base directory based on user role
const resolveUploadPath = (req) => {
  const base = path.join(__dirname, "../../../../uploads/tutorials");
  let role = req.user?.role?.toLowerCase() || "other";
  if (["superadmin", "admin"].includes(role)) role = "admin";
  const roleDir = path.join(base, role);
  if (!fs.existsSync(roleDir)) fs.mkdirSync(roleDir, { recursive: true });
  return roleDir;
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = resolveUploadPath(req);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${base}-${timestamp}${ext}`);
  },
});

// Optional: strict file type filter
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "video/mp4", "video/webm"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type"), false);
  }
  cb(null, true);
};

module.exports = multer({ storage, fileFilter });
