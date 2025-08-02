const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./offers.service");
const tagService = require("./offerTag.service");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const mailService = require("../../services/mailService");
const slugify = require("slugify");
const db = require("../../config/database");

exports.createOffer = catchAsync(async (req, res) => {
  const {
    tags: rawTags,
    title,
    description,
    budget,
    timeframe,
    offer_type,
    expires_at,
  } = req.body;
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
  if (expires_at) {
    if (new Date(expires_at) <= new Date()) {
      return res.status(400).json({ message: "Expiration must be in the future" });
    }
    data.expires_at = expires_at;
  }
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
  if (data.expires_at && new Date(data.expires_at) <= new Date()) {
    return res.status(400).json({ message: "Expiration must be in the future" });
  }
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
  const offer = await service.getOfferById(req.params.id);
  await service.deleteOffer(req.params.id);

  if (offer && req.user.role && req.user.role.toLowerCase() === "admin") {
    const creator = await userModel.findContactInfo(offer.student_id);
    if (creator) {
      const userMsg = `Your offer "${offer.title}" was deleted by ${req.user.full_name}.`;
      const adminMsg = `You deleted offer "${offer.title}" from ${creator.full_name}.`;

      await Promise.all([
        creator.email
          ? mailService.sendMail({
              to: creator.email,
              subject: "Offer deleted",
              html: `<p>Dear ${creator.full_name},</p><p>Your offer "${offer.title}" has been deleted by admin ${req.user.full_name}.</p>`,
            })
          : Promise.resolve(),
        notificationService.createNotification({
          user_id: creator.id,
          type: "offer_deleted",
          message: userMsg,
        }),
        messageService.createMessage({
          sender_id: req.user.id,
          receiver_id: creator.id,
          message: userMsg,
        }),
        notificationService.createNotification({
          user_id: req.user.id,
          type: "offer_deleted",
          message: adminMsg,
        }),
        messageService.createMessage({
          sender_id: req.user.id,
          receiver_id: req.user.id,
          message: adminMsg,
        }),
      ]);
    }
  }

  sendSuccess(res, null, "Offer deleted");
});
