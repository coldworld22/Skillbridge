const logger = require('../../utils/logger.js');
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./groups.service");
const { v4: uuidv4 } = require("uuid");
const AppError = require("../../utils/AppError");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const mailService = require("../../services/mailService");
const whatsappService = require("../../services/whatsappService");
const { frontendBase } = require("../../utils/frontend");
const db = require("../../config/database");
const planService = require("../plans/plans.service");
const { parsePlanFeatures } = require("../../utils/planFeatures");

const normalize = (value) =>
  value ? String(value).trim().toLowerCase() : "";

const slugify = (value) => {
  const normalized = normalize(value);
  return normalized ? normalized.replace(/[\s_]+/g, "-") : "";
};

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    return ["true", "1", "yes", "on"].includes(normalized);
  }
  return false;
};

const PLAN_GROUP_OWNERSHIP_LIMITS = {
  instructor: {
    "instructor-basic": 1,
    "instructor-basic-plan": 1,
    "basic": 1,
    "basic-plan": 1,
    "instructor-pro": 15,
    "instructor-pro-plan": 15,
    pro: 15,
  },
  student: {
    basic: 1,
    "basic-plan": 1,
    "student-basic": 1,
    "student-basic-plan": 1,
    regular: 5,
    "regular-plan": 5,
    "student-regular": 5,
    "student-regular-plan": 5,
    prime: 15,
    "prime-plan": 15,
    "student-prime": 15,
    "student-prime-plan": 15,
  },
};

const collectPlanCandidates = (user, plan) => {
  const candidates = new Set();

  const push = (value) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach(push);
      return;
    }
    const str = `${value}`.trim();
    if (str) candidates.add(str);
  };

  const planLikeSources = [
    plan,
    user?.plan,
    user?.subscription?.plan,
    user?.subscription,
  ];

  planLikeSources.forEach((source) => {
    if (!source || typeof source !== "object") return;
    push(source.slug);
    push(source.name);
    push(source.plan_slug);
    push(source.plan_name);
    push(source.planTier);
    push(source.plan_tier);
    push(source.tier);
  });

  push(user?.plan_slug);
  push(user?.plan_name);
  push(user?.planTier);
  push(user?.plan_tier);
  push(user?.planType);
  push(user?.plan_type);
  push(user?.subscription_plan_slug);
  push(user?.subscription_plan_name);

  return Array.from(candidates);
};

const resolveOwnedLimit = (role, ...candidates) => {
  const limits = PLAN_GROUP_OWNERSHIP_LIMITS[role] || {};
  for (const candidate of candidates) {
    const normalized = normalize(candidate);
    if (!normalized) continue;

    const slugCandidate = slugify(candidate);

    if (Object.prototype.hasOwnProperty.call(limits, slugCandidate)) {
      return limits[slugCandidate];
    }

    if (Object.prototype.hasOwnProperty.call(limits, normalized)) {
      return limits[normalized];
    }
  }
  return null;
};

const fallbackOwnedLimitForRole = (role) => {
  const limits = PLAN_GROUP_OWNERSHIP_LIMITS[role];
  if (!limits) return null;

  const numericCandidates = Object.values(limits)
    .map((value) => {
      if (value === "unlimited") return Infinity;
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    })
    .filter((value) => value !== null);

  if (!numericCandidates.length) return null;
  const min = Math.min(...numericCandidates);
  return Number.isFinite(min) ? min : "unlimited";
};

const getUserGroupRole = async (groupId, userId) => {
  const role = await service.getMemberRole(groupId, userId);
  return role;
};

const ensureGroupMembership = async (group, user, { requireAdmin = false } = {}) => {
  if (!group) {
    throw new AppError("Group not found", 404);
  }

  if (!user || !user.id) {
    throw new AppError("Not authorized", 403);
  }

  const normalizedRole = normalize(user.role);
  if (["admin", "superadmin"].includes(normalizedRole)) {
    return { isCreator: false, role: "admin", platformBypass: true };
  }

  const isCreator = String(group.creator_id) === String(user.id);
  if (isCreator) {
    return { isCreator: true, role: "admin" };
  }

  const role = await getUserGroupRole(group.id, user.id);
  if (!role) {
    throw new AppError("Not authorized", 403);
  }

  if (requireAdmin && !["admin", "moderator"].includes(role)) {
    throw new AppError("Forbidden", 403);
  }

  return { isCreator: false, role };
};

exports.createGroup = catchAsync(async (req, res) => {
  const planId =
    req.user.plan_id ||
    req.user.plan?.id ||
    req.user.subscription?.plan_id;
  const fetchedPlan = planId ? await planService.getPlanById(planId) : null;
  const plan = fetchedPlan || req.user.plan || req.user.subscription?.plan || null;
  const features = parsePlanFeatures(plan);
  const normalizedRole = normalize(req.user.role);
  const isPlatformAdmin = ["admin", "superadmin"].includes(normalizedRole);

  let ownedLimit = null;
  if (!isPlatformAdmin) {
    if (
      features["groups_owned_limit"] !== undefined &&
      features["groups_owned_limit"] !== null
    ) {
      ownedLimit = features["groups_owned_limit"];
    } else {
      const planCandidates = collectPlanCandidates(req.user, plan);
      ownedLimit = resolveOwnedLimit(normalizedRole, ...planCandidates);
      if (ownedLimit === null) {
        ownedLimit = fallbackOwnedLimitForRole(normalizedRole);
      }
    }

    if (!features["groups_create"] && ownedLimit === null) {
      throw new AppError("Upgrade plan to create more groups", 403);
    }

    if (ownedLimit !== null && ownedLimit !== "unlimited") {
      const limitValue = Number(ownedLimit);
      if (!Number.isNaN(limitValue)) {
        const ownedCount = await service.countGroupsOwnedByUser(req.user.id);
        if (ownedCount >= limitValue) {
          const suffix = limitValue === 1 ? "group" : "groups";
          throw new AppError(
            `You can create up to ${limitValue} ${suffix} on your current plan.`,
            403
          );
        }
      }
    }
  } else {
    ownedLimit = "unlimited";
  }

  const {
    name,
    description,
    visibility,
    requires_approval,
    category_id,
    max_size,
    timezone,
    invited_users,
    invite_methods,
  } = req.body;
  if (await service.findByName(name)) {
    throw new AppError("Group name already exists", 409);
  }
  const normalizedRequiresApproval =
    requires_approval === undefined ? true : toBoolean(requires_approval);

  const group = await service.createGroup({
    id: uuidv4(),
    creator_id: req.user.id,
    name,
    description,
    visibility: visibility || "public",
    requires_approval: normalizedRequiresApproval,
    cover_image: req.file ? `/uploads/groups/${req.file.filename}` : undefined,
    category_id: category_id || null,
    max_size: max_size || null,
    timezone: timezone || null,
    status: "pending",
  });
  if (req.body.tags) {
    const tags = Array.isArray(req.body.tags)
      ? req.body.tags
      : JSON.parse(req.body.tags);
    await service.syncGroupTags(group.id, tags);
  }
  await service.addMember(group.id, req.user.id, "admin");

  const inviteUserIds = invited_users
    ? Array.isArray(invited_users)
      ? invited_users
      : JSON.parse(invited_users)
    : [];
  const inviteMethods = invite_methods
    ? Array.isArray(invite_methods)
      ? invite_methods
      : JSON.parse(invite_methods)
    : [];

  if (visibility === "private" && inviteUserIds.length) {
    const inviteMsg = `${req.user.full_name} invited you to join the group "${name}".`;

    for (const uid of inviteUserIds) {
      await service.requestJoin(group.id, uid, { status: "approved" });
      const contact = await userModel.findContactInfo(uid);
      if (!contact) continue;

      const role = (contact.role || "").toLowerCase();

      const rolePath =
        role === "instructor"
          ? "instructor"
          : role === "student"
            ? "student"
            : "admin";
      // Use configured frontend URL or default to localhost for dev
      const host = frontendBase;
      const groupLink = `${host}/dashboard/${rolePath}/groups/${group.id}`;

      const inviteLinkMsg = `${inviteMsg} ${groupLink}`;

      await Promise.all([
        notificationService.createNotification({
          user_id: uid,
          type: "group_invite",
          message: inviteLinkMsg,
        }),
        messageService.createMessage({
          sender_id: req.user.id,
          receiver_id: uid,
          message: inviteLinkMsg,
        }),
      ]);
      if (inviteMethods.includes("email") && contact.email) {
        await mailService.sendMail({
          to: contact.email,
          subject: "Group Invitation",
          html: `<p>${inviteMsg}</p><p><a href="${groupLink}">Join Group</a></p>`,
        });
      }
      if (inviteMethods.includes("whatsapp") && contact.phone) {
        await whatsappService.sendWhatsApp({
          to: contact.phone,
          message: inviteLinkMsg,
        });
      }
    }
  } else {
    const students = await userModel.findStudents();
    const instructors = await userModel.findInstructors();
    const admins = await userModel.findAdmins();
    const recipients = [...students, ...instructors, ...admins].filter(
      (u) => u.id !== req.user.id,
    );
    const message = `${req.user.full_name} created a new group "${name}"`;

    await Promise.all([
      ...recipients.map((u) =>
        notificationService.createNotification({
          user_id: u.id,
          type: "group_created",
          message,
        }),
      ),
      ...recipients.map((u) =>
        messageService.createMessage({
          sender_id: req.user.id,
          receiver_id: u.id,
          message,
        }),
      ),
    ]);
  }

  const full = await service.getGroupById(group.id);
  sendSuccess(res, full, "Group created");
});

exports.listGroups = catchAsync(async (req, res) => {
  const { search, status = "all" } = req.query;
  const data = await service.listGroups({ search, status });
  sendSuccess(res, data);
});

exports.getGroup = catchAsync(async (req, res) => {
  const group = await service.getGroupById(req.params.id);
  if (!group) {
    throw new AppError("Group not found", 404);
  }
  sendSuccess(res, group);
});

exports.updateGroup = catchAsync(async (req, res) => {
  const existing = await service.getGroupById(req.params.id);
  if (!existing) throw new AppError("Group not found", 404);

  const { role, isCreator } = await ensureGroupMembership(existing, req.user, {
    requireAdmin: true,
  });
  if (!isCreator && role !== "admin") {
    throw new AppError("Forbidden", 403);
  }

  const data = { ...req.body };
  if (Object.prototype.hasOwnProperty.call(data, "requires_approval")) {
    data.requires_approval = toBoolean(data.requires_approval);
  }
  if (
    data.status &&
    !["active", "inactive", "suspended", "pending"].includes(data.status)
  ) {
    throw new AppError("Invalid status", 400);
  }

  if (req.file) data.cover_image = `/uploads/groups/${req.file.filename}`;
  const updated = await service.updateGroup(req.params.id, data);

  if (req.body.tags) {
    const tags = Array.isArray(req.body.tags)
      ? req.body.tags
      : JSON.parse(req.body.tags);
    await service.syncGroupTags(req.params.id, tags);
  }

  if (data.status && data.status !== existing.status) {
    const msg = `Your group "${existing.name}" status changed to ${data.status}`;
    await Promise.all([
      notificationService.createNotification({
        user_id: existing.creator_id,
        type: "group_status",
        message: msg,
      }),
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: existing.creator_id,
        message: msg,
      }),
    ]);
  }

  sendSuccess(res, updated);
});

exports.deleteGroup = catchAsync(async (req, res) => {
  const existing = await service.getGroupById(req.params.id);
  if (!existing) {
    // Align behaviour: deleting a non-existent group should still be 404
    throw new AppError("Group not found", 404);
  }

  const { isCreator, role } = await ensureGroupMembership(existing, req.user, {
    requireAdmin: true,
  });

  if (!isCreator && role !== "admin") {
    throw new AppError("Forbidden", 403);
  }

  await service.deleteGroup(req.params.id);

  if (existing) {
    const msg = `Your group "${existing.name}" has been deleted`;
    await Promise.all([
      notificationService.createNotification({
        user_id: existing.creator_id,
        type: "group_deleted",
        message: msg,
      }),
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: existing.creator_id,
        message: msg,
      }),
    ]);
  }

  sendSuccess(res, null, "Deleted");
});

exports.getMyGroups = catchAsync(async (req, res) => {
  const data = await service.getUserGroups(req.user.id);
  sendSuccess(res, data);
});

exports.joinGroup = catchAsync(async (req, res) => {
  const groupId = req.params.id;
  const group = await service.getGroupById(groupId);
  if (!group) throw new AppError("Group not found", 404);

  const normalizedStatus = (group.status || "").toLowerCase();
  const normalizedUserRole = normalize(req.user.role);
  if (["inactive", "suspended"].includes(normalizedStatus)) {
    throw new AppError("This group is not accepting new members right now", 403);
  }

  const forceApproval = true;

  const existingRole = await service.getMemberRole(groupId, req.user.id);
  if (existingRole) {
    sendSuccess(
      res,
      { status: "member", role: existingRole },
      "You are already a member of this group",
    );
    return;
  }

  const existingRequest = await service.getJoinRequest(groupId, req.user.id);
  if (existingRequest?.status === "pending") {
    sendSuccess(
      res,
      { status: "pending", request: existingRequest },
      "Your join request is already pending approval",
    );
    return;
  }

  if (existingRequest?.status === "approved") {
    const member = await service.addMember(groupId, req.user.id, "member");
    sendSuccess(
      res,
      { status: "member", role: member?.role || "member", member },
      "Joined group",
    );
    return;
  }

  const needsApproval = true;

  const planId =
    req.user.plan_id ||
    req.user.plan?.id ||
    req.user.subscription?.plan_id;
  const plan = planId ? await planService.getPlanById(planId) : null;
  const features = parsePlanFeatures(plan);
  const joinLimit = features["groups_join_limit"];
  if (joinLimit && joinLimit !== "unlimited") {
    const limitNum = Number(joinLimit);
    if (!Number.isNaN(limitNum)) {
      const count = await service.countUserGroups(req.user.id);
      if (count >= limitNum) {
        throw new AppError("Upgrade plan to join more groups", 403);
      }
    }
  }

  if (group.max_size && Number(group.max_size) > 0) {
    const currentMembers = await service.countMembers(groupId);
    if (currentMembers >= Number(group.max_size)) {
      throw new AppError("This group is currently full", 400);
    }
  }

  if (needsApproval) {
    const reqRow = await service.requestJoin(groupId, req.user.id);

    const adminIds = await service.listAdminIds(groupId);
    const note = `${req.user.full_name} requested to join the group "${group.name}"`;

    const recipients = adminIds.filter((uid) => uid !== req.user.id);
    await Promise.all(
      recipients.map((uid) =>
        notificationService.createNotification({
          user_id: uid,
          type: "join_request",
          message: note,
        })
      )
    );
    await Promise.all(
      recipients.map((uid) =>
        messageService.createMessage({
          sender_id: req.user.id,
          receiver_id: uid,
          message: note,
        })
      )
    );

    sendSuccess(res, { status: "pending", request: reqRow }, "Request sent");
  } else {
    const member = await service.addMember(groupId, req.user.id, "member");
    sendSuccess(
      res,
      { status: "member", role: member?.role || "member", member },
      "Joined group",
    );
  }
});

exports.cancelJoin = catchAsync(async (req, res) => {
  const groupId = req.params.id;
  await service.cancelJoinRequest(groupId, req.user.id);
  sendSuccess(res, null, "Request cancelled");
});

exports.listTags = catchAsync(async (_req, res) => {
  const data = await service.listTags();
  sendSuccess(res, data);
});
exports.listMembers = catchAsync(async (req, res) => {
  const group = await service.getGroupById(req.params.id);
  await ensureGroupMembership(group, req.user);
  const members = await service.listMembers(req.params.id);
  sendSuccess(res, members);
});

exports.sendEmail = catchAsync(async (req, res) => {
  const { id } = req.params;
  const group = await service.getGroupById(id);
  const { role } = await ensureGroupMembership(group, req.user, {
    requireAdmin: true,
  });
  if (role !== "admin") {
    throw new AppError("Forbidden", 403);
  }
  const members = await service.listMembers(id);
  await Promise.all(
    members
      .filter((m) => m.user_id !== req.user.id)
      .map((m) =>
        messageService.sendEmail({
          sender_id: req.user.id,
          receiver_id: m.user_id,
          subject: req.body.subject,
          message: req.body.message,
        })
      )
  );
  sendSuccess(res, null, "Email sent");
});

exports.manageMember = catchAsync(async (req, res) => {
  const { memberId } = req.params;
  const { action } = req.body;
  const groupId = req.params.id;

  const group = await service.getGroupById(groupId);
  const { role } = await ensureGroupMembership(group, req.user, {
    requireAdmin: true,
  });
  if (role === "moderator") {
    const targetRole = await service.getMemberRole(groupId, memberId);
    if (targetRole === "admin") {
      throw new AppError("Cannot manage admin", 403);
    }
  }

  const result = await service.manageMember(groupId, memberId, action);
  sendSuccess(res, result);
});

exports.listJoinRequests = catchAsync(async (req, res) => {
  const group = await service.getGroupById(req.params.id);
  await ensureGroupMembership(group, req.user, { requireAdmin: true });
  const requests = await service.listJoinRequests(req.params.id);
  sendSuccess(res, requests);
});

exports.manageJoinRequest = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body;
  if (!["approve", "reject"].includes(action)) {
    throw new AppError("Invalid action", 400);
  }
  const request = await service.getJoinRequestById(requestId);
  if (!request) {
    throw new AppError("Request not found", 404);
  }
  const group = await service.getGroupById(request.group_id);
  await ensureGroupMembership(group, req.user, { requireAdmin: true });
  if (
    action === "approve" &&
    group.max_size &&
    Number(group.max_size) > 0
  ) {
    const currentMembers = await service.countMembers(group.id);
    if (currentMembers >= Number(group.max_size)) {
      throw new AppError("This group is currently full", 400);
    }
  }
  const result = await service.manageJoinRequest(requestId, action);
  if (result?.request) {
    const refreshedGroup = await service.getGroupById(result.request.group_id);
    const note =
      action === "approve"
        ? `Your request to join "${refreshedGroup.name}" was approved`
        : `Your request to join "${refreshedGroup.name}" was rejected`;
    await notificationService.createNotification({
      user_id: result.request.user_id,
      type: "join_request_" + action,
      message: note,
    });
    await messageService.createMessage({
      sender_id: req.user.id,
      receiver_id: result.request.user_id,
      message: note,
    });
  }
  sendSuccess(res, result);
});

exports.getGroupPermissions = catchAsync(async (req, res) => {
  const group = await service.getGroupById(req.params.id);
  await ensureGroupMembership(group, req.user, { requireAdmin: true });
  const perms = await service.getGroupPermissions(req.params.id);
  sendSuccess(res, perms);
});

exports.updateGroupPermissions = catchAsync(async (req, res) => {
  const group = await service.getGroupById(req.params.id);
  await ensureGroupMembership(group, req.user, { requireAdmin: true });
  const perms = await service.updateGroupPermissions(req.params.id, req.body);
  sendSuccess(res, perms);
});

exports.startVideoCall = catchAsync(async (req, res) => {
  const { id } = req.params;
  const group = await service.getGroupById(id);
  if (!group) throw new AppError("Group not found", 404);

  const role = await service.getMemberRole(id, req.user.id);
  if (!role) throw new AppError("Not authorized", 403);

  const perms = await service.getGroupPermissions(id);
  const rolePerms = perms[role] || {};
  if (!rolePerms.video) throw new AppError("Not authorized", 403);

  const members = await service.listMembers(id);
  const recipients = members
    .map((m) => m.user_id)
    .filter((uid) => uid !== req.user.id);

  const roomId = uuidv4();

  const note = `${req.user.full_name} started a video call in group "${group.name}"`;

  await Promise.all(
    recipients.map(async (uid) => {
      await db("video_calls").insert({
        caller_id: req.user.id,
        receiver_id: uid,
        room_id: roomId,
      });

      await messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: uid,
        message: roomId,
        type: "video-call",
      });

      await notificationService.createNotification({
        user_id: uid,
        type: "group_video_call",
        message: note,
      });

      try {
        if (global.io && global.userSockets?.[uid]) {
          global.io
            .to(global.userSockets[uid])
            .emit("incoming-call", {
              chatId: id,
              roomId,
              name: req.user.full_name,
            });
        }
      } catch (err) {
        logger.error("Failed to emit video call event", err.message);
      }
    })
  );

  sendSuccess(res, { roomId }, "Video call started");
});
