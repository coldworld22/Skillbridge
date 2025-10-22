const path = require("path");

const UPLOADS_DIR = path.join(__dirname, "../../uploads");
const UPLOADS_SEGMENT = "/uploads/";

const stripOrigin = (value = "") =>
  value.replace(/^https?:\/\/[^/]+/i, "");

const normalizeRelativePath = (value) => {
  if (!value) return null;
  const cleaned = value.replace(/^\/+/, "");
  if (!cleaned) return null;
  const normalized = path.normalize(cleaned);
  if (normalized.startsWith("..")) return null;
  return normalized;
};

exports.resolveUploadFilePath = (input) => {
  if (!input) return null;
  const stripped = stripOrigin(String(input));
  const segmentIndex = stripped.indexOf(UPLOADS_SEGMENT);
  let relative;
  if (segmentIndex === -1) {
    relative = normalizeRelativePath(stripped);
  } else {
    const candidate = stripped.slice(segmentIndex + UPLOADS_SEGMENT.length);
    relative = normalizeRelativePath(candidate);
  }
  if (!relative) return null;
  const normalized = normalizeRelativePath(relative);
  if (!normalized) return null;
  const absolutePath = path.join(UPLOADS_DIR, normalized);
  const resolved = path.resolve(absolutePath);
  if (!resolved.startsWith(UPLOADS_DIR)) return null;
  return resolved;
};

exports.buildDownloadFilename = (title, extension = "pdf") => {
  const base =
    typeof title === "string" && title.trim() ? title.trim() : "book";
  const sanitized = base
    .replace(/[^a-z0-9_\-]+/gi, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");
  const name = sanitized || "book";
  const ext = extension.replace(/^\./, "");
  return `${name}.${ext}`;
};
