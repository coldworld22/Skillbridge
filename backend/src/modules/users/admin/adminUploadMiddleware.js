// 📁 src/modules/users/admin/adminUploadMiddleware.js

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");

/**
 * @desc Middleware for handling admin file uploads
 * - Supports avatar and identity document uploads
 * - Saves files to specific directories
 * - Validates file types and sizes 
 * * @route /api/users/admin/:id/avatar
 * @route /api/users/admin/profile/identity
 * @access Admin
 */

const resolveDir = () =>
  path.resolve(
    process.env.ADMIN_UPLOAD_DIR ||
      path.join(__dirname, "../../../../uploads/admin")
  );

const ensureWritable = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
  fs.accessSync(dir, fs.constants.W_OK);
};

let baseUploadDir = resolveDir();
try {
  ensureWritable(baseUploadDir);
} catch (err) {
  const fallback = path.join(os.tmpdir(), "admin_uploads");
  try {
    ensureWritable(fallback);
    baseUploadDir = fallback;
  } catch (fallbackErr) {
    throw new Error(
      `Failed to initialize admin upload directories at ${baseUploadDir}: ${err.message}`
    );
  }
}

const avatarDir = path.join(baseUploadDir, "avatars");
const identityDir = path.join(baseUploadDir, "identity");
[
  avatarDir,
  identityDir,
].forEach((dir) => {
  ensureWritable(dir);
});

// Storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine path based on field name
    if (file.fieldname === "avatar") {
      cb(null, avatarDir);
    } else if (file.fieldname === "identity") {
      cb(null, identityDir);
    } else {
      cb(new Error("Invalid upload field"), null);
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const id = req.params.id || req.user?.id || "unknown";
    const timestamp = Date.now();

    if (file.fieldname === "avatar") {
      cb(null, `admin-avatar-${id}-${timestamp}${ext}`);
    } else if (file.fieldname === "identity") {
      cb(null, `admin-id-${id}-${timestamp}${ext}`);
    } else {
      cb(new Error("Invalid field name"), null);
    }
  },
});

// Restrict file types
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "avatar" && file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else if (file.fieldname === "identity" && 
             (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/"))) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type for this field"), false);
  }
};


module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB
});
