require("dotenv").config();
const knex = require("knex");

const db = knex({
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 10 },
});

db.raw("SELECT 1")
  .then(() => console.log("✅ PostgreSQL Database Connected"))
  .catch((err) => {
    console.error("❌ Database Connection Error:", err);
    process.exit(1);
  });

module.exports = db;
