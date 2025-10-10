const path = require("path");
const fs = require("fs");
const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const AppError = require("../../../utils/AppError");
const resourceService = require("./classResource.service");
const classService = require("../class.service");

const mapResource = (resource) => {
  if (!resource) return resource;
  return {
    ...resource,
    resource_url: resource.resource_url,
  };
};

const ensureClassAccess = async (classId, user) => {
  const cls = await classService.getClassById(classId);
  if (!cls) throw new AppError("Class not found", 404);
  if (user?.role === "instructor" && cls.instructor_id !== user.id) {
    throw new AppError("You are not allowed to manage this class", 403);
  }
  return cls;
};

exports.listByClass = catchAsync(async (req, res) => {
  const list = await resourceService.listByClass(req.params.classId);
  sendSuccess(res, list.map(mapResource));
});

exports.createResource = catchAsync(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const { classId } = req.params;
  await ensureClassAccess(classId, req.user);

  const { title, resource_type, link_url } = req.body;
  const isFile = resource_type === "file" || req.file;

  if (!title) throw new AppError("Title is required", 400);

  if (isFile) {
    if (!req.file) throw new AppError("File upload required", 400);
  } else {
    if (!link_url) throw new AppError("Link URL is required", 400);
  }

  const data = {
    class_id: classId,
    title,
    resource_type: isFile ? "file" : "link",
    resource_url: isFile ? `/uploads/class-resources/${req.file.filename}` : link_url,
    mime_type: isFile ? req.file.mimetype : null,
    size: isFile ? req.file.size : null,
  };

  const resource = await resourceService.create(data);
  sendSuccess(res, mapResource(resource), "Resource uploaded");
});

exports.deleteResource = catchAsync(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const resource = await resourceService.findById(req.params.resourceId);
  if (!resource) throw new AppError("Resource not found", 404);
  await ensureClassAccess(resource.class_id, req.user);

  if (resource.resource_type === "file" && resource.resource_url) {
    const relativePath = resource.resource_url.startsWith("/")
      ? resource.resource_url.slice(1)
      : resource.resource_url;
    const filePath = path.join(__dirname, "../../../", relativePath);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          // fail silently
        }
      });
    }
  }

  await resourceService.remove(resource.id);
  sendSuccess(res, null, "Resource removed");
});
