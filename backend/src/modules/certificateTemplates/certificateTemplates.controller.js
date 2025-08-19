const service = require("./certificateTemplates.service");
const { sendSuccess } = require("../../utils/response");

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
