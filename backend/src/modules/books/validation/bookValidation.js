const Joi = require('joi');

const id = Joi.number().integer().positive();

exports.createBook = Joi.object({
  title: Joi.string().min(1).required(),
  short_description: Joi.string().allow('', null),
  detailed_description: Joi.string().allow('', null),
  price: Joi.number().min(0).required(),
  language: Joi.string().required(),
  license_type: Joi.string().required(),
  category_id: id.required(),
  allow_preview: Joi.boolean()
    .truthy('1')
    .truthy(1)
    .truthy('true')
    .falsy('0')
    .falsy(0)
    .falsy('false')
    .default(false),
  tags: Joi.alternatives(Joi.array().items(Joi.string()), Joi.string()).optional(),
});

exports.updateBook = Joi.object({
  title: Joi.string().min(1),
  short_description: Joi.string().allow('', null),
  detailed_description: Joi.string().allow('', null),
  price: Joi.number().min(0),
  language: Joi.string(),
  license_type: Joi.string(),
  category_id: id,
  allow_preview: Joi.boolean()
    .truthy('1')
    .truthy(1)
    .truthy('true')
    .falsy('0')
    .falsy(0)
    .falsy('false'),
  tags: Joi.alternatives(Joi.array().items(Joi.string()), Joi.string()),
});

exports.cartAction = Joi.object({
  bookId: id.required(),
  action: Joi.string().valid('add', 'remove').default('add'),
});

exports.wishlist = Joi.object({
  bookId: id.required(),
});
