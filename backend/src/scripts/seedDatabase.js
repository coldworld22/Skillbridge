const knex = require('knex');
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';

async function seedDatabase() {
  const db = knex(knexConfig[environment]);
  try {
    await db.migrate.latest();
    if (environment !== 'production') {
      await db.seed.run();
      console.log('Database migrated and seeded successfully');
    } else {
      console.log('Database migrated successfully');
    }
  } catch (error) {
    console.error('Database seeding failed:', error);
  } finally {
    await db.destroy();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
