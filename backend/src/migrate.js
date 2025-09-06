const path = require('path');
const db = require('./config/database');
const logger = require('./utils/logger.js');

async function migrate() {
  try {
    await db.migrate.latest({ directory: path.join(__dirname, 'migrations') });
    logger.log('✅ Database migrations up to date');
    process.exit(0);
  } catch (err) {
    logger.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

migrate();
