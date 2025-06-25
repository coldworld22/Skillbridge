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
  const item = service.update(parseInt(req.params.id, 10), req.body.quantity);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  sendSuccess(res, item, 'Cart updated');
};

exports.removeItem = (req, res) => {
  const item = service.remove(parseInt(req.params.id, 10));
  if (!item) return res.status(404).json({ message: 'Item not found' });
  sendSuccess(res, null, 'Item removed');
};
