const Joi = require("joi");

const boolean = Joi.boolean()
  .truthy("1")
  .truthy(1)
  .truthy("true")
  .falsy("0")
  .falsy(0)
  .falsy("false");

const sampleDataSchema = Joi.object({
  id: Joi.string().allow(null, ""),
  student_name: Joi.string().allow(null, ""),
  course_name: Joi.string().allow(null, ""),
  issue_date: Joi.string().allow(null, ""),
  instructor: Joi.string().allow(null, ""),
  platform_name: Joi.string().allow(null, ""),
  grade: Joi.string().allow(null, ""),
}).unknown(true);

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
  sample_data: sampleDataSchema,
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
  sample_data: sampleDataSchema,
})
  .min(1)
  .options({ stripUnknown: true });
