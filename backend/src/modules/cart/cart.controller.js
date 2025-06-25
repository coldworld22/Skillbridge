const service = require('./cart.service');
const { sendSuccess } = require('../../utils/response');

exports.addItem = (req, res) => {
  const item = service.add(req.body);
  sendSuccess(res, item, 'Item added to cart');
};

exports.getItems = (_req, res) => {
  const items = service.list();
  sendSuccess(res, items);
};

exports.updateItem = (req, res) => {
  // Accept string IDs without parsing to integer
  const item = service.update(req.params.id, req.body.quantity);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  sendSuccess(res, item, 'Cart updated');
};

exports.removeItem = (req, res) => {
  // Accept string IDs without parsing to integer
  const item = service.remove(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  sendSuccess(res, null, 'Item removed');
};
