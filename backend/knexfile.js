// knexfile.js
require("dotenv").config();
const path = require("path");

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'db', // must match service name in docker-compose.yml
      user: 'postgres',
      password: 'your_db_password',
      database: 'skillbridge'
    },
    migrations: {
      directory: './src/migrations',
    },
    seeds: {
      directory: './src/seeds',
    },
  }
};

