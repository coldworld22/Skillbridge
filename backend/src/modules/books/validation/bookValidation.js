const Joi = require('joi');

const id = Joi.number().integer().positive();
const uuid = Joi.string().uuid();

exports.createBook = Joi.object({
  title: Joi.string().min(1).required(),
  short_description: Joi.string().allow('', null),
  detailed_description: Joi.string().allow('', null),
  price: Joi.number().min(0).required(),
  language: Joi.string().required(),
  license_type: Joi.string().required(),
  category_id: uuid.required(),
  is_free: Joi.boolean()
    .truthy('1')
    .truthy(1)
    .truthy('true')
    .falsy('0')
    .falsy(0)
    .falsy('false')
    .optional(),
  allow_preview: Joi.boolean()
    .truthy('1')
    .truthy(1)
    .truthy('true')
    .falsy('0')
    .falsy(0)
    .falsy('false')
    .default(false),
  status: Joi.string().optional(),
  tags: Joi.alternatives(Joi.array().items(Joi.string()), Joi.string()).optional(),
  included_plans: Joi.alternatives(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
}).unknown(true);

exports.updateBook = Joi.object({
  title: Joi.string().min(1),
  short_description: Joi.string().allow('', null),
  detailed_description: Joi.string().allow('', null),
  price: Joi.number().min(0),
  language: Joi.string(),
  license_type: Joi.string(),
  category_id: uuid,
  is_free: Joi.boolean()
    .truthy('1')
    .truthy(1)
    .truthy('true')
    .falsy('0')
    .falsy(0)
    .falsy('false'),
  allow_preview: Joi.boolean()
    .truthy('1')
    .truthy(1)
    .truthy('true')
    .falsy('0')
    .falsy(0)
    .falsy('false'),
  tags: Joi.alternatives(Joi.array().items(Joi.string()), Joi.string()),
  included_plans: Joi.alternatives(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
}).unknown(true);

exports.updateBookStatus = Joi.object({
  status: Joi.string()
    .valid('pending', 'approved', 'rejected', 'active', 'inactive')
    .required(),
});

exports.cartAction = Joi.object({
  bookId: id.required(),
  action: Joi.string().valid('add', 'remove').default('add'),
});

exports.wishlist = Joi.object({
  bookId: id.required(),
});
