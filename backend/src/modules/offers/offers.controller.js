const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./offers.service");
const tagService = require("./offerTag.service");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const slugify = require("slugify");
const db = require("../../config/database");

exports.createOffer = catchAsync(async (req, res) => {
  const { tags: rawTags, title, description, budget, timeframe, offer_type } = req.body;
  const data = {
    id: uuidv4(),
    student_id: req.user.id,
    title,
    description,
    budget,
    timeframe,
    offer_type,
    status: "open",
  };
  const tags = rawTags ? JSON.parse(rawTags) : [];
  const offer = await service.createOffer(data);
  if (tags.length) {
    const tagIds = [];
    for (const name of tags) {
      const existing = await tagService.findByName(name);
      const tag =
        existing ||
        (await tagService.createTag({
          name,
          slug: slugify(name, { lower: true, strict: true }),
        }));
      tagIds.push(tag.id);
    }
    await service.addOfferTags(offer.id, tagIds);
    offer.tags = await service.getOfferTags(offer.id);
  }

  const instructors = await userModel.findInstructors();
  const students = await userModel.findStudents();
  const admins = await userModel.findAdmins();
  const message = `New offer from ${req.user.full_name} (${req.user.role})`;

  let recipients = [];
  if (req.user.role && req.user.role.toLowerCase() === "instructor") {
    recipients = [...students, ...admins];
  } else {
    recipients = [...instructors, ...admins];
  }

  await Promise.all([
    ...recipients.map((u) =>
      notificationService.createNotification({
        user_id: u.id,
        type: "new_offer",
        message,
      })
    ),
    ...recipients.map((u) =>
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: u.id,
        message,
      })
    ),
  ]);

  sendSuccess(res, offer, "Offer created");
});

exports.getOffers = catchAsync(async (_req, res) => {
  const offers = await service.getOffers();
  sendSuccess(res, offers);
});

exports.getOfferById = catchAsync(async (req, res) => {
  const offer = await service.getOfferById(req.params.id);
  sendSuccess(res, offer);
});

exports.updateOffer = catchAsync(async (req, res) => {
  const existing = await service.getOfferById(req.params.id);
  const { tags: rawTags, ...data } = req.body;
  const offer = await service.updateOffer(req.params.id, data);

  const tags = rawTags
    ? typeof rawTags === "string"
      ? JSON.parse(rawTags)
      : rawTags
    : null;
  if (tags) {
    await db("offer_tag_map").where({ offer_id: offer.id }).del();
    if (tags.length) {
      const tagIds = [];
      for (const name of tags) {
        const existingTag = await tagService.findByName(name);
        const tag =
          existingTag ||
          (await tagService.createTag({
            name,
            slug: slugify(name, { lower: true, strict: true }),
          }));
        tagIds.push(tag.id);
      }
      await service.addOfferTags(offer.id, tagIds);
      offer.tags = await service.getOfferTags(offer.id);
    } else {
      offer.tags = [];
    }
  }

  const instructors = await userModel.findInstructors();
  const students = await userModel.findStudents();
  const admins = await userModel.findAdmins();
  const message = `Offer updated by ${req.user.full_name} (${req.user.role})`;

  let recipients = [];
  if (req.user.role && req.user.role.toLowerCase() === "instructor") {
    recipients = [...students, ...admins];
  } else {
    recipients = [...instructors, ...admins];
  }

  await Promise.all([
    ...recipients.map((u) =>
      notificationService.createNotification({
        user_id: u.id,
        type: "offer_updated",
        message,
      })
    ),
    ...recipients.map((u) =>
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: u.id,
        message,
      })
    ),
  ]);


  sendSuccess(res, offer, "Offer updated");
});

exports.deleteOffer = catchAsync(async (req, res) => {
  await service.deleteOffer(req.params.id);
  sendSuccess(res, null, "Offer deleted");
});
