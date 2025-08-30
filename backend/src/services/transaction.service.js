const db = require('../config/database');

/**
 * Run the provided callback within a database transaction.
 * Automatically commits if the callback resolves and rolls back on error.
 *
 * @param {(trx: import('knex').Knex.Transaction) => Promise<any>} handler
 * @returns {Promise<any>}
 */
async function withTransaction(handler) {
  const trx = await db.transaction();
  try {
    const result = await handler(trx);
    await trx.commit();
    return result;
  } catch (err) {
    await trx.rollback();
    throw err;
  }
}

module.exports = { withTransaction };
