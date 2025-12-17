/**
 * @file validate.js
 * @desc Universal validation middleware for Express.js
 *       Supports Zod and Joi schemas for body, query, and params.
 */

const { ZodError } = require("zod");

// helper to run validation for either Zod or Joi schemas
async function runSchema(schema, data) {
  if (!schema) return data;

  // Zod schema
  if (typeof schema.parseAsync === "function") {
    return await schema.parseAsync(data);
  }
  if (typeof schema.parse === "function") {
    return schema.parse(data);
  }

  // Joi schema
  if (typeof schema.validate === "function" || typeof schema.validateAsync === "function") {
    const validation = schema.validateAsync
      ? await schema.validateAsync(data, { abortEarly: false })
      : schema.validate(data, { abortEarly: false });
    if (validation.error) throw validation.error;
    return validation.value || validation;
  }

  // unknown schema type - return data as is
  return data;
}

/**
 * @param {Object} schemas - Optional Zod schemas:
 *   {
 *     body?: ZodSchema,
 *     query?: ZodSchema,
 *     params?: ZodSchema
 *   }
 * @returns Express middleware function
 */
module.exports = (schemaConfig = {}) => {
  // Allow passing a single schema for body validation
  const schemas =
    typeof schemaConfig.parse === "function" ||
    typeof schemaConfig.validate === "function" ||
    typeof schemaConfig.validateAsync === "function"
      ? { body: schemaConfig }
      : schemaConfig;

  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await runSchema(schemas.body, req.body);
      }
      if (schemas.query) {
        req.query = await runSchema(schemas.query, req.query);
      }
      if (schemas.params) {
        req.params = await runSchema(schemas.params, req.params);
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const firstMessage =
          err.errors && err.errors.length ? err.errors[0].message : null;
        return res.status(400).json({
          message: "Validation error",
          errors: err.errors,
          detail: firstMessage || null,
        });
      }

      if (err.isJoi || err.details) {
        const firstDetail =
          Array.isArray(err.details) && err.details.length
            ? err.details[0].message
            : null;
        return res.status(400).json({
          message: "Validation error",
          errors: err.details,
          detail: firstDetail || null,
        });
      }

      next(err);
    }
  };
};
