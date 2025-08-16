const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Storage driver for payment receipt uploads.
 *
 * When `RECEIPT_STORAGE` is set to `s3`, files are uploaded to the
 * configured S3 bucket using private ACL. Otherwise files are written to a
 * local directory that is **not** exposed via the public `/uploads` route.
 */

let storage;

if (process.env.RECEIPT_STORAGE === 's3') {
  // Lazily require these heavy dependencies only when S3 is enabled.
  const multerS3 = require('multer-s3');
  const { S3Client } = require('@aws-sdk/client-s3');

  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  storage = multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'private',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `payment-receipts/${unique}${path.extname(file.originalname)}`);
    },
  });
} else {
  // Default to local storage in a secure directory outside the public uploads folder
  const uploadDir =
    process.env.PAYMENT_RECEIPT_DIR ||
    path.join(__dirname, '../../../secure/payment-receipts');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  });
}

module.exports = multer({ storage });
