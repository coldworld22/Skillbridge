const cart = [];

exports.list = () => cart;

exports.add = (item) => {
  const existing = cart.find((c) => c.id === item.id);
  if (existing) {
    existing.quantity += item.quantity || 1;
    return existing;
  }
  const newItem = { ...item, quantity: item.quantity || 1 };
  cart.push(newItem);
  return newItem;
};

exports.update = (id, quantity) => {
  const item = cart.find((c) => c.id === id);
  if (!item) return null;
  item.quantity = quantity;
  return item;
};

exports.remove = (id) => {
  const index = cart.findIndex((c) => c.id === id);
  if (index === -1) return null;
  return cart.splice(index, 1)[0];
};
