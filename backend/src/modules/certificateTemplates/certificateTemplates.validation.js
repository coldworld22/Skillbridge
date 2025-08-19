const Joi = require("joi");

const boolean = Joi.boolean()
  .truthy("1")
  .truthy(1)
  .truthy("true")
  .falsy("0")
  .falsy(0)
  .falsy("false");

exports.createTemplate = Joi.object({
  name: Joi.string().required(),
  type: Joi.string(),
  font_family: Joi.string(),
  title_font: Joi.string(),
  border_color: Joi.string(),
  logo: Joi.string().allow("", null),
  background: Joi.string().allow("", null),
  show_qr: boolean,
  active: boolean,
}).options({ stripUnknown: true });

exports.updateTemplate = Joi.object({
  name: Joi.string(),
  type: Joi.string(),
  font_family: Joi.string(),
  title_font: Joi.string(),
  border_color: Joi.string(),
  logo: Joi.string().allow("", null),
  background: Joi.string().allow("", null),
  show_qr: boolean,
  active: boolean,
})
  .min(1)
  .options({ stripUnknown: true });
