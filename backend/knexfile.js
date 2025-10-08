require('dotenv').config();

const baseConfig = {
  client: 'pg',
  migrations: {
    directory: './src/migrations'
  },
  seeds: {
    directory: './src/seeds'
  }
};

module.exports = {
  development: {
    ...baseConfig,
    connection: process.env.DATABASE_URL
  },
  test: {
    ...baseConfig,
    connection: process.env.TEST_DATABASE_URL
  },
  production: {
    ...baseConfig,
    connection: process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URL
  }
};
