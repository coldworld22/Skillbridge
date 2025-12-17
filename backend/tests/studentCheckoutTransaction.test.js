jest.mock('../src/config/database', () => {
  const commitSpy = jest.fn();
  const rollbackSpy = jest.fn();

  const data = {
    online_classes: [{ id: 'c1' }],
    class_enrollments: [],
    cart_items: [{ user_id: 'u1', item_id: 'c1' }],
    payments: [],
  };

  return {
    __data: data,
    __commit: commitSpy,
    __rollback: rollbackSpy,
    transaction: jest.fn(async (cb) => {
      const local = JSON.parse(JSON.stringify(data));

      const query = (table) => {
        if (table === 'online_classes') {
          return {
            where(cond) {
              this._cond = cond;
              return this;
            },
            first() {
              return Promise.resolve(
                local.online_classes.find((r) => r.id === this._cond.id)
              );
            },
          };
        }
        if (table === 'class_enrollments') {
          return {
            insert(rec) {
              local.class_enrollments.push(rec);
              return {
                returning: async () => [rec],
              };
            },
          };
        }
        if (table === 'cart_items') {
          return {
            where(cond) {
              this._cond = cond;
              return this;
            },
            whereIn(_field, values) {
              this._values = values;
              return this;
            },
            del() {
              local.cart_items = local.cart_items.filter(
                (c) => !(c.user_id === this._cond.user_id && this._values.includes(c.item_id))
              );
              return Promise.resolve();
            },
          };
        }
        if (table === 'payments') {
          return {
            insert(rec) {
              local.payments.push(rec);
              return {
                returning: async () => [rec],
              };
            },
          };
        }
        return {};
      };

      const trx = (table) => query(table);

      try {
        const res = await cb(trx);
        Object.assign(data, local);
        commitSpy();
        return res;
      } catch (err) {
        rollbackSpy();
        throw err;
      }
    }),
  };
});

jest.mock('../src/modules/cart/cart.service', () => ({
  list: jest.fn(),
}));

jest.mock('../src/modules/paymentMethods/paymentMethods.service', () => ({
  getById: jest.fn(),
}));

jest.mock('../src/modules/payments/payments.service', () => ({
  create: jest.fn(),
  STATUS: { AWAITING_APPROVAL: 'awaiting_approval', PENDING_PAYMENT: 'pending_payment', PAID: 'paid' },
}));

const Student = require('../src/modules/users/student/student.class');
const cartService = require('../src/modules/cart/cart.service');
const paymentMethodsService = require('../src/modules/paymentMethods/paymentMethods.service');
const paymentsService = require('../src/modules/payments/payments.service');
const db = require('../src/config/database');

describe('Student checkout transaction', () => {
  beforeEach(() => {
    cartService.list.mockResolvedValue([
      { id: 'c1', item_type: 'class', price: 50 },
    ]);
    paymentMethodsService.getById.mockResolvedValue({ type: 'card' });
    paymentsService.create.mockReset();
    db.transaction.mockClear();
    db.__commit.mockClear();
    db.__rollback.mockClear();
    db.__data.class_enrollments = [];
    db.__data.cart_items = [{ user_id: 'u1', item_id: 'c1' }];
    db.__data.payments = [];
  });

  it('rolls back when payment creation fails', async () => {
    paymentsService.create.mockRejectedValue(new Error('fail'));
    const student = new Student('u1');
    await expect(student.checkout('pm1')).rejects.toThrow('fail');

    expect(db.__rollback).toHaveBeenCalled();
    expect(db.__commit).not.toHaveBeenCalled();
    expect(db.__data.class_enrollments).toHaveLength(0);
    expect(db.__data.cart_items).toHaveLength(1);
    expect(db.__data.payments).toHaveLength(0);
  });
});

