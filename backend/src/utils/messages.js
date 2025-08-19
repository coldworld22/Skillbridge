const MESSAGES = {
  CURRENCY: {
    FIELDS_REQUIRED: 'Label, code and symbol are required',
    INVALID_EXCHANGE_RATE: 'Invalid exchange rate',
    INVALID_TAX_RATE: 'Invalid tax rate',
    CODE_EXISTS: 'Currency code already exists',
    NOT_FOUND: 'Currency not found',
    LABEL_REQUIRED: 'Label is required',
    CODE_REQUIRED: 'Code is required',
    SYMBOL_REQUIRED: 'Symbol is required',
    CREATED: 'Currency created',
    UPDATED: 'Currency updated',
    DELETED: 'Currency deleted',
    CREATED_NOTIFICATION: (label) => `Currency "${label}" created`,
    UPDATED_NOTIFICATION: (label) => `Currency "${label}" updated`,
    DELETED_NOTIFICATION: (label) => `Currency "${label}" deleted`,
  },
};

module.exports = MESSAGES;
