const db = require("../../config/database");

exports.getByInstructor = async (instructor_id) => {
  return db("instructor_wallets").where({ instructor_id }).first();
};

exports.increment = async (instructor_id, amount, trx) => {
  const query = trx || db;
  const [row] = await query("instructor_wallets")
    .insert({ instructor_id, balance: amount })
    .onConflict("instructor_id")
    .merge({ balance: query.raw('?? + ?', ['balance', amount]), updated_at: query.fn.now() })
    .returning("*");
  return row;
};

exports.decrement = async (instructor_id, amount) => {
  return db.transaction(async (trx) => {
    const wallet = await trx("instructor_wallets")
      .where({ instructor_id })
      .forUpdate()
      .first();

    const balance = wallet ? Number(wallet.balance) : 0;
    if (balance < Number(amount)) {
      throw new Error("Insufficient balance");
    }

    const [row] = await trx("instructor_wallets")
      .where({ instructor_id })
      .update({
        balance: trx.raw('?? - ?', ['balance', amount]),
        updated_at: trx.fn.now(),
      })
      .returning("*");

    return row;
  });
};
