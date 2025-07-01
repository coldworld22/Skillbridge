const db = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

exports.createGroup = async (data) => {
  const [row] = await db("groups").insert(data).returning("*");
  return row;
};

exports.listGroups = async (search) => {
  return db("groups")
    .modify((qb) => {
      if (search) qb.whereILike("name", `%${search}%`);
    })
    .select("*")
    .orderBy("created_at", "desc");
};

exports.getGroupById = (id) => db("groups").where({ id }).first();

exports.updateGroup = async (id, data) => {
  const [row] = await db("groups").where({ id }).update(data).returning("*");
  return row;
};

exports.deleteGroup = (id) => db("groups").where({ id }).del();

exports.addMember = async (groupId, userId, role = "admin") => {
  const [row] = await db("group_members")
    .insert({ id: uuidv4(), group_id: groupId, user_id: userId, role })
    .returning("*");
  return row;
};

exports.requestJoin = async (groupId, userId) => {
  const [row] = await db("group_join_requests")
    .insert({ id: uuidv4(), group_id: groupId, user_id: userId })
    .onConflict(["group_id", "user_id"]).merge({ status: "pending", responded_at: null })
    .returning("*");
  return row;
};

exports.getUserGroups = async (userId) => {
  const memberQuery = db("group_members as gm")
    .join("groups as g", "gm.group_id", "g.id")
    .select("g.*", "gm.role")
    .where("gm.user_id", userId);

  const pendingQuery = db("group_join_requests as gj")
    .join("groups as g", "gj.group_id", "g.id")
    .select("g.*", db.raw("'pending' as role"))
    .where("gj.user_id", userId)
    .andWhere("gj.status", "pending");

  return memberQuery.unionAll(pendingQuery);
};

exports.listTags = async () => {
  return db("group_tags as t")
    .leftJoin("group_tag_map as m", "t.id", "m.tag_id")
    .groupBy("t.id")
    .select("t.id", "t.name", "t.slug", db.raw("COUNT(m.group_id) as group_count"))
    .where("t.active", true)
    .orderBy("t.name");
};
// List all members of a group with basic user info
exports.listMembers = (groupId) => {
  return db('group_members as gm')
    .join('users as u', 'gm.user_id', 'u.id')
    .select(
      'u.id as user_id',
      db.raw("COALESCE(u.full_name, '') as name"),
      db.raw("COALESCE(u.avatar_url, '') as avatar"),
      'gm.role'
    )
    .where('gm.group_id', groupId);
};

// Update member role or remove
exports.manageMember = async (groupId, userId, action) => {
  if (action === 'kick') {
    await db('group_members').where({ group_id: groupId, user_id: userId }).del();
    return { action: 'kick' };
  }
  const role = action === 'promote' ? 'admin' : action === 'demote' ? 'member' : null;
  if (role) {
    const [row] = await db('group_members')
      .where({ group_id: groupId, user_id: userId })
      .update({ role })
      .returning('*');
    return row;
  }
  return null;
};

exports.isMember = async (groupId, userId) => {
  const row = await db('group_members')
    .where({ group_id: groupId, user_id: userId })
    .first();
  return !!row;
};

