exports.seed = async function (knex) {
  await knex('currencies').del();
  const now = new Date();
  const currencies = [
    { label: 'US Dollar', code: 'USD', symbol: '$', is_default: true },
    { label: 'Euro', code: 'EUR', symbol: '€' },
    { label: 'British Pound', code: 'GBP', symbol: '£' },
    { label: 'Japanese Yen', code: 'JPY', symbol: '¥' },
    { label: 'Chinese Yuan', code: 'CNY', symbol: '¥' },
    { label: 'Saudi Riyal', code: 'SAR', symbol: '﷼' },
    { label: 'UAE Dirham', code: 'AED', symbol: 'د.إ' },
    { label: 'Kuwaiti Dinar', code: 'KWD', symbol: 'د.ك' },
    { label: 'Indian Rupee', code: 'INR', symbol: '₹' },
    { label: 'Canadian Dollar', code: 'CAD', symbol: 'CA$' },
    { label: 'Australian Dollar', code: 'AUD', symbol: 'AU$' },
    { label: 'Swiss Franc', code: 'CHF', symbol: 'CHF' },
    { label: 'Qatari Riyal', code: 'QAR', symbol: '﷼' },
    { label: 'Egyptian Pound', code: 'EGP', symbol: 'ج.م' },
    { label: 'Turkish Lira', code: 'TRY', symbol: '₺' },
    { label: 'South Korean Won', code: 'KRW', symbol: '₩' },
    { label: 'Singapore Dollar', code: 'SGD', symbol: 'S$' },
    { label: 'Russian Ruble', code: 'RUB', symbol: '₽' },
  ];
  await knex('currencies').insert(
    currencies.map((c) => ({
      ...c,
      exchange_rate: 1,
      is_active: true,
      auto_update: true,
      created_at: now,
      updated_at: now,
    }))
  );
};
