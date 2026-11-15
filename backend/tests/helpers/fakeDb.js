// Minimal chainable stand-in for the Knex instance exported by
// src/config/database. Every query builder method returns the builder;
// `first()` resolves to the fixture row for the table and awaiting the
// builder resolves to an array. Use inside a jest.mock factory:
//
//   jest.mock('../src/config/database', () =>
//     require('./helpers/fakeDb').createFakeDb({ books: { instructor_id: 'x' } }));
function createFakeDb(fixtures = {}) {
  const makeBuilder = (tableExpr) => {
    const table = String(tableExpr || '').split(/\s+/)[0];
    const row = fixtures[table];
    const result = row === undefined ? [] : [row];
    const target = function builder() {};
    const proxy = new Proxy(target, {
      get(_t, prop) {
        if (prop === 'then') {
          return (resolve, reject) => Promise.resolve(result).then(resolve, reject);
        }
        if (prop === 'catch') return (fn) => Promise.resolve(result).catch(fn);
        if (prop === 'first') return () => Promise.resolve(row);
        return () => proxy;
      },
      apply() {
        return proxy;
      },
    });
    return proxy;
  };

  const db = (table) => makeBuilder(table);
  db.raw = jest.fn(() => Promise.resolve({ rows: [] }));
  db.fn = { now: () => new Date() };
  db.transaction = jest.fn(async (cb) => (typeof cb === 'function' ? cb(db) : db));
  db.schema = { hasTable: jest.fn(async () => true), hasColumn: jest.fn(async () => true) };
  return db;
}

module.exports = { createFakeDb };
