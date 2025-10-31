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
  type: Joi.string().valid("Completion", "Achievement", "Attendance"),
  font_family: Joi.string().valid(
    "Georgia, serif",
    "Times New Roman, serif",
    "Arial, sans-serif"
  ),
  title_font: Joi.string().valid(
    "'Great Vibes', cursive",
    "'Playfair Display', serif",
    "'Pacifico', cursive"
  ),
  border_color: Joi.string(),
  logo: Joi.string().allow("", null),
  background: Joi.string().allow("", null),
  show_qr: boolean,
  active: boolean,
  for_tutorials: boolean,
  for_online_classes: boolean,
}).options({ stripUnknown: true });

exports.updateTemplate = Joi.object({
  name: Joi.string(),
  type: Joi.string().valid("Completion", "Achievement", "Attendance"),
  font_family: Joi.string().valid(
    "Georgia, serif",
    "Times New Roman, serif",
    "Arial, sans-serif"
  ),
  title_font: Joi.string().valid(
    "'Great Vibes', cursive",
    "'Playfair Display', serif",
    "'Pacifico', cursive"
  ),
  border_color: Joi.string(),
  logo: Joi.string().allow("", null),
  background: Joi.string().allow("", null),
  show_qr: boolean,
  active: boolean,
  for_tutorials: boolean,
  for_online_classes: boolean,
})
  .min(1)
  .options({ stripUnknown: true });
