/**
 * @file validate.js
 * @desc Universal Zod validation middleware for Express.js
 *       Supports body, query, and params validation.
 */

const { ZodError } = require("zod");

/**
 * @param {Object} schemas - Optional Zod schemas:
 *   {
 *     body?: ZodSchema,
 *     query?: ZodSchema,
 *     params?: ZodSchema
 *   }
 * @returns Express middleware function
 */
module.exports = (schemas = {}) => {
  return (req, res, next) => {
    try {
      // 🔹 Validate req.body
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      // 🔹 Validate req.query
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }

      // 🔹 Validate req.params
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: err.errors,
        });
      }

      next(err); // Let Express handle unexpected errors
    }
  };
};
