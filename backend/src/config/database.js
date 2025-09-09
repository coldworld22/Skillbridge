const logger = require('../utils/logger.js');
const knex = require('knex');
const knexfile = require('../../knexfile.js');

const environment = process.env.NODE_ENV || 'development';
let config = knexfile[environment];

// In test environments the database connection details may be omitted.
// Fallback to an in-memory SQLite database so modules can require the DB
// without throwing configuration errors.
if (!config || !config.connection) {
  if (environment === 'test') {
    config = {
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    };
  } else {
    throw new Error(`${environment} database configuration is missing`);
  }
}

const db = knex({ ...config, pool: { min: 2, max: 10 } });

/**
 * Attempt to verify a database connection with retries.
 * @param {number} maxAttempts Maximum connection attempts
 */
async function connectWithRetry(maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await db.raw('SELECT 1');
      logger.log('✅ PostgreSQL Database Connected');
      return;
    } catch (err) {
      logger.error(`❌ Database connection attempt ${attempt} failed:`, err);
      if (attempt === maxAttempts) {
        logger.error(
          `❌ Database connection failed after ${maxAttempts} attempts`,
          err
        );
        throw err;
      }
      const delay = Math.pow(2, attempt - 1) * 1000;
      logger.warn(`Retrying in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

db.connectWithRetry = connectWithRetry;

module.exports = db;
