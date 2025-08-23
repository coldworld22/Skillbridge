const logger = require('../utils/logger.js');
require("dotenv").config();
const knex = require("knex");

const db = knex({
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 10 },
});

if (process.env.NODE_ENV !== "test") {
  db.raw("SELECT 1")
    .then(() => logger.log("✅ PostgreSQL Database Connected"))
    .catch((err) => {
      logger.error("❌ Database Connection Error:", err);
      process.exit(1);
    });
}

module.exports = db;
