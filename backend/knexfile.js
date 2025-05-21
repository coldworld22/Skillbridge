// knexfile.js
require("dotenv").config();
const path = require("path");

module.exports = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: path.resolve(__dirname, "src/migrations"),
    },
    seeds: {
      directory: path.resolve(__dirname, "src/seeds"),
    },
  },
};
