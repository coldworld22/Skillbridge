const config = require('./src/config/env');

const baseConfig = {
  client: 'pg',
  migrations: {
    directory: './src/migrations',
  },
  seeds: {
    directory: './src/seeds',
  },
};

module.exports = {
  development: {
    ...baseConfig,
    connection: config.getDatabaseUrl('development'),
  },
  test: {
    ...baseConfig,
    connection: config.getDatabaseUrl('test'),
  },
  production: {
    ...baseConfig,
    connection: config.getDatabaseUrl('production'),
  },
};
