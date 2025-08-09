const db = require("../../config/database");

exports.list = async (userId) => {
  return db("cart_items")
    .where({ user_id: userId })
    .select("item_id as id", "name", "quantity", "added_at", "reminder_sent");
};

exports.add = async (userId, item) => {
  return db.transaction(async (trx) => {
    const cartExists = await trx("carts").where({ user_id: userId }).first();
    if (!cartExists) {
      await trx("carts").insert({ user_id: userId });
    }
    const existing = await trx("cart_items").where({ user_id: userId, item_id: item.id }).first();
    if (existing) {
      const quantity = existing.quantity + (item.quantity || 1);
      await trx("cart_items").where({ id: existing.id }).update({ quantity });
    } else {
      await trx("cart_items").insert({
        user_id: userId,
        item_id: item.id,
        name: item.name,
        quantity: item.quantity || 1,
        added_at: new Date(),
        reminder_sent: false,
      });
    }
    const row = await trx("cart_items").where({ user_id: userId, item_id: item.id }).first();
    return {
      id: row.item_id,
      name: row.name,
      quantity: row.quantity,
      added_at: row.added_at,
      reminder_sent: row.reminder_sent,
    };
  });
};

exports.update = async (userId, id, quantity) => {
  const existing = await db("cart_items").where({ user_id: userId, item_id: id }).first();
  if (!existing) return null;
  await db("cart_items").where({ id: existing.id }).update({ quantity });
  const updated = await db("cart_items").where({ id: existing.id }).first();
  return {
    id: updated.item_id,
    name: updated.name,
    quantity: updated.quantity,
    added_at: updated.added_at,
    reminder_sent: updated.reminder_sent,
  };
};

exports.remove = async (userId, id) => {
  const existing = await db("cart_items").where({ user_id: userId, item_id: id }).first();
  if (!existing) return null;
  await db("cart_items").where({ id: existing.id }).del();
  return {
    id: existing.item_id,
    name: existing.name,
    quantity: existing.quantity,
    added_at: existing.added_at,
    reminder_sent: existing.reminder_sent,
  };
};
