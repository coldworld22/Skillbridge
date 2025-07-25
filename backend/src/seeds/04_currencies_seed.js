exports.seed = async function (knex) {
  await knex('currencies').del();
  const now = new Date();
  const currencies = [
    { label: 'US Dollar', code: 'USD', symbol: '$', is_default: true, exchange_rate: 1 },
    { label: 'Euro', code: 'EUR', symbol: '€', exchange_rate: 0.93 },
    { label: 'British Pound', code: 'GBP', symbol: '£', exchange_rate: 0.79 },
    { label: 'Japanese Yen', code: 'JPY', symbol: '¥', exchange_rate: 138 },
    { label: 'Chinese Yuan', code: 'CNY', symbol: '¥', exchange_rate: 7.1 },
    { label: 'Saudi Riyal', code: 'SAR', symbol: '﷼', exchange_rate: 3.75 },
    { label: 'UAE Dirham', code: 'AED', symbol: 'د.إ', exchange_rate: 3.67 },
    { label: 'Kuwaiti Dinar', code: 'KWD', symbol: 'د.ك', exchange_rate: 0.31 },
    { label: 'Indian Rupee', code: 'INR', symbol: '₹', exchange_rate: 83 },
    { label: 'Canadian Dollar', code: 'CAD', symbol: 'CA$', exchange_rate: 1.36 },
    { label: 'Australian Dollar', code: 'AUD', symbol: 'AU$', exchange_rate: 1.51 },
    { label: 'Swiss Franc', code: 'CHF', symbol: 'CHF', exchange_rate: 0.89 },
    { label: 'Qatari Riyal', code: 'QAR', symbol: '﷼', exchange_rate: 3.64 },
    { label: 'Egyptian Pound', code: 'EGP', symbol: 'ج.م', exchange_rate: 30.9 },
    { label: 'Turkish Lira', code: 'TRY', symbol: '₺', exchange_rate: 32 },
    { label: 'South Korean Won', code: 'KRW', symbol: '₩', exchange_rate: 1350 },
    { label: 'Singapore Dollar', code: 'SGD', symbol: 'S$', exchange_rate: 1.35 },
    { label: 'Russian Ruble', code: 'RUB', symbol: '₽', exchange_rate: 90 },

  ];
  await knex('currencies').insert(
    currencies.map((c) => ({
      ...c,
      is_active: true,
      auto_update: true,
      created_at: now,
      updated_at: now,
    }))
  );
};
