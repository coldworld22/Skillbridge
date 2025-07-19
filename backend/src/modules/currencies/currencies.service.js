const db = require('../../config/database');

exports.create = async (data) => {
  return db.transaction(async (trx) => {
    if (data.is_default) {
      await trx('currencies').update({ is_default: false });
    }
    const [row] = await trx('currencies').insert(data).returning('*');
    return row;
  });
};

exports.list = () => {
  return db('currencies').select('*').orderBy('label');
};

exports.getById = (id) => db('currencies').where({ id }).first();

exports.update = async (id, data) => {
  return db.transaction(async (trx) => {
    if (data.is_default) {
      await trx('currencies').update({ is_default: false });
    }
    const [row] = await trx('currencies').where({ id }).update(data).returning('*');
    return row;
  });
};

exports.remove = (id) => db('currencies').where({ id }).del();
