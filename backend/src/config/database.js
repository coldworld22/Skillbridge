const logger = require('../utils/logger.js');
require('dotenv').config();
const knex = require('knex');
const knexfile = require('../../knexfile.js');

const environment = process.env.NODE_ENV || 'development';
const config = knexfile[environment];

if (!config || !config.connection) {
  logger.error(`${environment} database configuration is missing`);
  process.exit(1);
}

const db = knex({ ...config, pool: { min: 2, max: 10 } });

if (environment !== 'test') {
  db.raw('SELECT 1')
    .then(() => logger.log('✅ PostgreSQL Database Connected'))
    .catch((err) => {
      logger.error('❌ Database Connection Error:', err);
      process.exit(1);
    });
}

module.exports = db;
