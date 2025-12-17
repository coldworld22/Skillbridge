const db = require("../../../config/database");
const logger = require("../../../utils/logger");
const { updateContributorStats } = require("../contributorStats.util");

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
    .leftJoin(
      db("community_views")
        .select("discussion_id")
        .count({ views: "id" })
        .groupBy("discussion_id")
        .as("v"),
      "v.discussion_id",
      "d.id"
    )
    .leftJoin(
      db("community_likes")
        .select("discussion_id")
        .count({ likes: "id" })
        .groupBy("discussion_id")
        .as("l"),
      "l.discussion_id",
      "d.id"
    )
    .leftJoin(
      db("community_votes")
        .select("discussion_id")
        .sum({ votes: "vote" })
        .groupBy("discussion_id")
        .as("t"),
      "t.discussion_id",
      "d.id"
    )
    .leftJoin(
      db("community_replies")
        .select("discussion_id")
        .count({ replies: "id" })
        .groupBy("discussion_id")
        .as("r"),
      "r.discussion_id",
      "d.id"
    )
    .select(
      "d.user_id",
      "d.id",
      "d.title",
      "d.content",
      "d.image_url",
      "d.created_at",
      "d.resolved",
      "d.locked",
      "u.full_name as user_name",
      "u.avatar_url as user_avatar",
      db.raw("COALESCE(v.views,0) as views"),
      db.raw("COALESCE(l.likes,0) as likes"),
      db.raw("COALESCE(t.votes,0) as votes"),
      db.raw("COALESCE(r.replies,0) as replies")
    )
    .orderBy("d.created_at", "desc");
  const tagsMap = await exports.getDiscussionTags(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, tags: tagsMap[r.id] || [] }));
};

exports.getDiscussion = async (id, viewerId, ip, userAgent) => {
  await exports.recordView(id, viewerId, ip, userAgent);
  const row = await db("community_discussions as d")
    .leftJoin("users as u", "d.user_id", "u.id")
    .leftJoin(
      db("community_views")
        .select("discussion_id")
        .count({ views: "id" })
        .groupBy("discussion_id")
        .as("v"),
      "v.discussion_id",
      "d.id"
    )
    .leftJoin(
      db("community_likes")
        .select("discussion_id")
        .count({ likes: "id" })
        .groupBy("discussion_id")
        .as("l"),
      "l.discussion_id",
      "d.id"
    )
    .leftJoin(
      db("community_votes")
        .select("discussion_id")
        .sum({ votes: "vote" })
        .groupBy("discussion_id")
        .as("t"),
      "t.discussion_id",
      "d.id"
    )
    .select(
      "d.user_id",
      "d.id",
      "d.title",
      "d.content",
      "d.image_url",
      "d.created_at",
      "d.resolved",
      "d.locked",
      "u.full_name as user_name",
      "u.avatar_url as user_avatar",
      db.raw("COALESCE(v.views,0) as views"),
      db.raw("COALESCE(l.likes,0) as likes"),
      db.raw("COALESCE(t.votes,0) as votes")
    )
    .where("d.id", id)
    .first();
  if (!row) return null;
  const tagsMap = await exports.getDiscussionTags(id);
  let liked = false;
  if (viewerId) {
    const likeRow = await db('community_likes')
      .where({ discussion_id: id, user_id: viewerId })
      .first();
    liked = !!likeRow;
  }
  return { ...row, tags: tagsMap[id] || [], liked };
};

exports.getDiscussionStatus = async (id) => {
  return db("community_discussions")
    .where({ id })
    .first("locked", "resolved");
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

  const BATCH_SIZE = 50;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (id) => {
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
      })
    );
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
  notifyAllUsers(disc).catch((err) => logger.error("Failed to broadcast community discussion", err));
  await updateContributorStats(data.user_id, 0, 1);
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

// Search discussion titles matching a query for related questions
exports.searchRelatedQuestions = async (q) => {
  if (!q) return [];
  const rows = await db('community_discussions')
    .whereILike('title', `%${q}%`)
    .limit(5)
    .pluck('title');
  return rows;
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

  const discussion = await db('community_discussions')
    .where({ id: data.discussion_id })
    .first('user_id', 'title');

  if (discussion) {
    const participants = await db('community_replies')
      .where({ discussion_id: data.discussion_id })
      .whereNot('user_id', data.user_id)
      .distinct('user_id');

    const recipientIds = new Set([
      discussion.user_id,
      ...participants.map((p) => p.user_id),
    ]);

    recipientIds.delete(data.user_id);

    const message = `New reply in discussion: ${discussion.title}`;

    for (const id of recipientIds) {
      await notificationService.createNotification({
        user_id: id,
        type: 'community',
        message,
      });
    }
  }

  await updateContributorStats(data.user_id, 0, 1);

  return {
    ...row,
    user_name: user?.full_name,
    user_avatar: user?.avatar_url,
  };
};

// View tracking
exports.recordView = async (discussionId, viewerId, ip, userAgent) => {
  return db('community_views').insert({
    id: uuidv4(),
    discussion_id: discussionId,
    viewer_id: viewerId || null,
    ip_address: ip,
    user_agent: userAgent,
  });
};

exports.getViewCount = async (discussionId) => {
  const [row] = await db('community_views').where({ discussion_id: discussionId }).count();
  return parseInt(row.count, 10) || 0;
};

// Likes
exports.likeDiscussion = async (userId, discussionId) => {
  const [row] = await db('community_likes')
    .insert({ id: uuidv4(), user_id: userId, discussion_id: discussionId })
    .onConflict(['user_id', 'discussion_id']).ignore()
    .returning('*');
  return row;
};

exports.unlikeDiscussion = async (userId, discussionId) => {
  return db('community_likes').where({ user_id: userId, discussion_id: discussionId }).del();
};

exports.getLikeCount = async (discussionId) => {
  const [row] = await db('community_likes').where({ discussion_id: discussionId }).count();
  return parseInt(row.count, 10) || 0;
};

// Votes
exports.voteDiscussion = async (userId, discussionId, vote) => {
  const existing = await db('community_votes')
    .where({ user_id: userId, discussion_id: discussionId })
    .first('vote');
  await db('community_votes')
    .insert({ id: uuidv4(), user_id: userId, discussion_id: discussionId, vote })
    .onConflict(['user_id', 'discussion_id']).merge({ vote });
  const [row] = await db('community_votes').where({ discussion_id: discussionId }).sum({ score: 'vote' });
  const total = parseInt(row.score, 10) || 0;
  const delta = vote - (existing ? existing.vote : 0);
  if (delta !== 0) {
    const disc = await db('community_discussions').where({ id: discussionId }).first('user_id');
    if (disc) await updateContributorStats(disc.user_id, delta, 0);
  }
  return total;
};

exports.getVoteScore = async (discussionId) => {
  const [row] = await db('community_votes').where({ discussion_id: discussionId }).sum({ score: 'vote' });
  return parseInt(row.score, 10) || 0;
};
