const cart = [];

exports.list = (userId) => cart.filter((c) => c.user_id === userId);

exports.getAll = () => cart;

exports.add = (userId, item) => {
  const existing = cart.find((c) => c.id === item.id && c.user_id === userId);
  if (existing) {
    existing.quantity += item.quantity || 1;
    return existing;
  }
  const newItem = {
    ...item,
    user_id: userId,
    quantity: item.quantity || 1,
    added_at: new Date(),
    reminder_sent: false,
  };
  cart.push(newItem);
  return newItem;
};

exports.update = (userId, id, quantity) => {
  const item = cart.find((c) => c.id === id && c.user_id === userId);
  if (!item) return null;
  item.quantity = quantity;
  return item;
};

exports.remove = (userId, id) => {
  const index = cart.findIndex((c) => c.id === id && c.user_id === userId);
  if (index === -1) return null;
  return cart.splice(index, 1)[0];
};
