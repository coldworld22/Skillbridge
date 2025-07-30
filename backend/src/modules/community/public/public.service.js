const db = require("../../../config/database");

exports.getDiscussionTags = async (ids) => {
  const rows = await db("community_discussion_tags as m")
    .join("community_tags as t", "m.tag_id", "t.id")
    .whereIn("m.discussion_id", Array.isArray(ids) ? ids : [ids])
    .select("m.discussion_id", "t.name");
  const map = {};
  rows.forEach((r) => {
    if (!map[r.discussion_id]) map[r.discussion_id] = [];
    map[r.discussion_id].push(r.name);
  });
  return map;
};

exports.listDiscussions = async () => {
  const rows = await db("community_discussions as d")
    .leftJoin("users as u", "d.user_id", "u.id")
    .select(
      "d.id",
      "d.title",
      "d.content",
      "d.image_url",
      "d.created_at",
      "d.resolved",
      "d.locked",
      "u.full_name as user_name",
      "u.avatar_url as user_avatar"
    )
    .orderBy("d.created_at", "desc");
  const tagsMap = await exports.getDiscussionTags(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, tags: tagsMap[r.id] || [] }));
};

exports.getDiscussion = async (id) => {
  const row = await db("community_discussions as d")
    .leftJoin("users as u", "d.user_id", "u.id")
    .select(
      "d.id",
      "d.title",
      "d.content",
      "d.image_url",
      "d.created_at",
      "d.resolved",
      "d.locked",
      "u.full_name as user_name",
      "u.avatar_url as user_avatar"
    )
    .where("d.id", id)
    .first();
  if (!row) return null;
  const tagsMap = await exports.getDiscussionTags(id);
  return { ...row, tags: tagsMap[id] || [] };
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

exports.syncDiscussionTags = async (discussionId, tagNames = []) => {
  if (!tagNames.length) return [];
  const existing = await db("community_tags").whereIn("name", tagNames);
  const map = {};
  existing.forEach((t) => { map[t.name] = t; });
  const toInsert = tagNames.filter((n) => !map[n]);
  const inserted = [];
  for (const name of toInsert) {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const [row] = await db("community_tags").insert({ name, slug }).returning("*");
    inserted.push(row);
  }
  const all = [...existing, ...inserted];
  for (const tag of all) {
    await db("community_discussion_tags")
      .insert({ discussion_id: discussionId, tag_id: tag.id })
      .onConflict(["discussion_id", "tag_id"]).ignore();
  }
  return all;
};

exports.createDiscussion = async (data) => {
  const [row] = await db("community_discussions")
    .insert({
      id: uuidv4(),
      user_id: data.user_id,
      title: data.title,
      content: data.content,
      tags: JSON.stringify(data.tags || []),
      image_url: data.image_url || null,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning("*");

  await exports.syncDiscussionTags(row.id, data.tags);
  const disc = { ...row, user_name: data.user_name, tags: data.tags };
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
exports.searchTags = async (q) => {
  return db('community_tags')
    .whereILike('name', `%${q}%`)
    .select('id', 'name', 'slug')
    .orderBy('name')
    .limit(10);
};

exports.listReplies = async (discussionId) => {
  return db('community_replies as r')
    .leftJoin('users as u', 'r.user_id', 'u.id')
    .where('r.discussion_id', discussionId)
    .select(
      'r.id',
      'r.content',
      'r.file_url',
      'r.is_answer',
      'r.created_at',
      'u.full_name as user_name',
      'u.avatar_url as user_avatar'
    )
    .orderBy('r.created_at', 'asc');
};

exports.createReply = async (data) => {
  const [row] = await db('community_replies')
    .insert({
      discussion_id: data.discussion_id,
      user_id: data.user_id,
      content: data.content,
      file_url: data.file_url || null,
    })
    .returning('*');

  const user = await db('users')
    .where({ id: data.user_id })
    .first('full_name', 'avatar_url');

  return {
    ...row,
    user_name: user?.full_name,
    user_avatar: user?.avatar_url,
  };
};
