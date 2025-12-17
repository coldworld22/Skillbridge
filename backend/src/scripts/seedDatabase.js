const knex = require('knex');
const knexConfig = require('../../knexfile');
const logger = require('../utils/logger');

const environment = process.env.NODE_ENV || 'development';
const seedEnabled = process.env.SEED_DB === 'true';

async function seedDatabase() {
  const db = knex(knexConfig[environment]);
  try {
    await db.migrate.latest();
    if (environment !== 'production' && seedEnabled) {
      await db.seed.run();
      logger.log('Database migrated and seeded successfully');
    } else {
      logger.log('Database migrated successfully');
    }
  } catch (error) {
    logger.error('Database seeding failed:', error);
  } finally {
    await db.destroy();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
