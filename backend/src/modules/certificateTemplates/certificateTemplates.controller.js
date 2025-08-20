const service = require("./certificateTemplates.service");
const { sendSuccess } = require("../../utils/response");
const path = require("path");

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

exports.list = async (req, res, next) => {
  try {
    const templates = await service.getAll();
    sendSuccess(res, templates);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const template = await service.getById(req.params.id);
    if (!template) return res.status(404).json({ message: "Template not found" });
    sendSuccess(res, template);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const template = await service.create(req.body);
    sendSuccess(res, template, 201);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const template = await service.update(req.params.id, req.body);
    if (!template) return res.status(404).json({ message: "Template not found" });
    sendSuccess(res, template);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const removed = await service.remove(req.params.id);
    if (!removed) return res.status(404).json({ message: "Template not found" });
    sendSuccess(res, { id: req.params.id });
  } catch (err) {
    next(err);
  }
};

exports.toggle = async (req, res, next) => {
  try {
    const template = await service.toggleStatus(req.params.id);
    if (!template) return res.status(404).json({ message: "Template not found" });
    sendSuccess(res, template);
  } catch (err) {
    next(err);
  }
};

exports.duplicate = async (req, res, next) => {
  try {
    const template = await service.duplicate(req.params.id);
    if (!template) return res.status(404).json({ message: "Template not found" });
    sendSuccess(res, template, 201);
  } catch (err) {
    next(err);
  }
};

exports.upload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype))
      return res.status(400).json({ message: "Invalid file type" });
    const sanitizedFilename = path
      .basename(req.file.filename)
      .replace(/[^\w.-]/g, "");
    // Use "/api/uploads" so the URL works behind reverse proxies (e.g., Nginx)
    // that forward all "/api" requests to the backend. Returning a direct
    // "/uploads" path causes the frontend to request the file from its own
    // server instead of the backend, resulting in broken images. Prefixing the
    // path with "/api" ensures the request is routed to the backend where the
    // static file middleware serves uploaded certificate assets.
    const url = `/api/uploads/certificateTemplates/${sanitizedFilename}`;
    sendSuccess(res, { url });
  } catch (err) {
    next(err);
  }
};
