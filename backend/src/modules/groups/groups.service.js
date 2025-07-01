const db = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

exports.findByName = async (name) => {
  return db("groups")
    .whereRaw("LOWER(name) = ?", [name.toLowerCase()])
    .first();
};

exports.createGroup = async (data) => {
  const [row] = await db("groups").insert(data).returning("*");
  return row;
};

exports.syncGroupTags = async (groupId, tagNames = []) => {
  if (!tagNames.length) return [];
  const existing = await db('group_tags').whereIn('name', tagNames);
  const existingMap = {};
  existing.forEach((t) => { existingMap[t.name] = t; });

  const toInsert = tagNames.filter((n) => !existingMap[n]);
  const inserted = [];
  for (const name of toInsert) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const [row] = await db('group_tags').insert({ name, slug }).returning('*');
    inserted.push(row);
  }

  const all = [...existing, ...inserted];
  for (const tag of all) {
    await db('group_tag_map')
      .insert({ group_id: groupId, tag_id: tag.id })
      .onConflict(['group_id', 'tag_id'])
      .ignore();
  }
  return all;
};

exports.getGroupTags = async (groupIds) => {
  const rows = await db('group_tag_map as m')
    .join('group_tags as t', 'm.tag_id', 't.id')
    .whereIn('m.group_id', Array.isArray(groupIds) ? groupIds : [groupIds])
    .select('m.group_id', 't.name');
  const map = {};
  rows.forEach((r) => {
    if (!map[r.group_id]) map[r.group_id] = [];
    map[r.group_id].push(r.name);
  });
  return map;
};

exports.listGroups = async (search) => {
  const rows = await db('groups as g')
    .leftJoin('users as u', 'g.creator_id', 'u.id')
    .leftJoin('categories as c', 'g.category_id', 'c.id')
    .leftJoin('group_members as gm', 'g.id', 'gm.group_id')
    .modify((qb) => {
      if (search) qb.whereILike('g.name', `%${search}%`);
    })
    .groupBy('g.id', 'u.full_name', 'c.name')
    .select(
      'g.*',
      db.raw("COALESCE(u.full_name, '') as creator_name"),
      db.raw("COALESCE(c.name, '') as category"),
      db.raw('COUNT(DISTINCT gm.id) as members_count')
    )
    .orderBy('g.created_at', 'desc');

  const tagsMap = await exports.getGroupTags(rows.map((g) => g.id));
  return rows.map((g) => ({ ...g, tags: tagsMap[g.id] || [] }));
};

exports.getGroupById = async (id) => {
  const group = await db('groups as g')
    .leftJoin('users as u', 'g.creator_id', 'u.id')
    .leftJoin('categories as c', 'g.category_id', 'c.id')
    .leftJoin('group_members as gm', 'g.id', 'gm.group_id')
    .where('g.id', id)
    .groupBy('g.id', 'u.full_name', 'c.name')
    .select(
      'g.*',
      db.raw("COALESCE(u.full_name, '') as creator_name"),
      db.raw("COALESCE(c.name, '') as category"),
      db.raw('COUNT(DISTINCT gm.id) as members_count')
    )
    .first();
  if (!group) return null;
  const tagsMap = await exports.getGroupTags(id);
  return { ...group, tags: tagsMap[id] || [] };
};

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

