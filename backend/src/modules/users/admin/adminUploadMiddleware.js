// 📁 src/modules/users/admin/adminUploadMiddleware.js

const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**
 * @desc Middleware for handling admin file uploads
 * - Supports avatar and identity document uploads
 * - Saves files to specific directories
 * - Validates file types and sizes 
 * * @route /api/users/admin/:id/avatar
 * @route /api/users/admin/profile/identity
 * @access Admin
 */

const baseUploadDir = path.join(__dirname, "../../../../uploads/admin");
const avatarDir = path.join(__dirname, "../../../../uploads/admin/avatars");

const identityDir = path.join(baseUploadDir, "identity");


// Ensure folders exist
[avatarDir, identityDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
});
