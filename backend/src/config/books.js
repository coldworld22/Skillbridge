const PRICE_RANGE_DEFAULT = Number(process.env.BOOK_PRICE_RANGE_DEFAULT || 100);
const PRICE_RANGE_MAX = Number(process.env.BOOK_PRICE_RANGE_MAX || 500);

module.exports = {
  PRICE_RANGE_DEFAULT,
  PRICE_RANGE_MAX,
};
