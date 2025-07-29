const db = require("../../../config/database");

exports.listDiscussions = async () => {
  return db("community_discussions as d")
    .leftJoin("users as u", "d.user_id", "u.id")
    .select(
      "d.id",
      "d.title",
      "d.content",
      "d.created_at",
      "d.resolved",
      "d.locked",
      "u.full_name as user_name"
    )
    .orderBy("d.created_at", "desc");
};

exports.getDiscussion = async (id) => {
  return db("community_discussions as d")
    .leftJoin("users as u", "d.user_id", "u.id")
    .select(
      "d.id",
      "d.title",
      "d.content",
      "d.created_at",
      "d.resolved",
      "d.locked",
      "u.full_name as user_name"
    )
    .where("d.id", id)
    .first();
};

const { v4: uuidv4 } = require('uuid');
const notificationService = require('../../notifications/notifications.service');
const messageService = require('../../messages/messages.service');
const userModel = require('../../users/user.model');
const emailUtil = require('../../../utils/email');

async function notifyAllUsers(discussion) {
  const admins = await userModel.findAdmins();
  const instructors = await userModel.findInstructors();
  const students = await userModel.findStudents();
  const sender = admins[0];
  const ids = [
    ...admins.map((a) => a.id),
    ...instructors.map((i) => i.id),
    ...students.map((s) => s.id),
  ].filter((id) => id !== discussion.user_id);

  const message = `New question posted: ${discussion.title}`;

  for (const id of ids) {
    await notificationService.createNotification({
      user_id: id,
      type: 'community',
      message,
    });
    if (sender) {
      await messageService.createMessage({
        sender_id: sender.id,
        receiver_id: id,
        message,
      });
    }
    const info = await userModel.findContactInfo(id);
    if (info?.email) {
      await emailUtil.sendNewDiscussionEmail(
        info.email,
        discussion.user_name,
        discussion.title
      );
    }
  }
}

exports.createDiscussion = async (data) => {
  const [row] = await db("community_discussions")
    .insert({
      id: uuidv4(),
      user_id: data.user_id,
      title: data.title,
      content: data.content,
      tags: JSON.stringify(data.tags || []),
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning("*");

  const disc = { ...row, user_name: data.user_name };
  await notifyAllUsers(disc);
  return disc;
};

exports.getTopContributors = async (limit = 5) => {
  return db("community_contributors as c")
    .join("users as u", "c.user_id", "u.id")
    .select(
      "u.full_name as name",
      "u.avatar_url as avatar",
      "c.discussions_count as contributions",
      "c.score as reputation"
    )
    .orderBy("c.score", "desc")
    .limit(limit);
};
