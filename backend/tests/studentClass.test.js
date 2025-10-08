const Student = require('../src/modules/users/student/student.class');

jest.mock('../src/modules/classes/class.service', () => ({
  getPublishedClasses: jest.fn(() => Promise.resolve({ data: [], meta: {} })),
  getPublicClassDetails: jest.fn((id) => Promise.resolve({ id, price: 10 })),
  getClassById: jest.fn((id) => Promise.resolve({ id, price: 10 }))
}));

jest.mock('../src/modules/classes/wishlist/classWishlist.service', () => ({
  add: jest.fn(() => Promise.resolve({})),
  remove: jest.fn(() => Promise.resolve()),
  listByUser: jest.fn(() => Promise.resolve([]))
}));

jest.mock('../src/modules/cart/cart.service', () => {
  const carts = {};
  return {
    _carts: carts,
    list: jest.fn((userId) => carts[userId] || []),
    add: jest.fn((userId, item) => {
      carts[userId] = carts[userId] || [];
      carts[userId].push(item);
      return item;
    }),
    remove: jest.fn((userId, id) => {
      const arr = carts[userId] || [];
      const idx = arr.findIndex((c) => c.id === id);
      if (idx !== -1) arr.splice(idx, 1);
    }),
  };
});

jest.mock('../src/modules/classes/enrollments/classEnrollment.service', () => ({
  getByUser: jest.fn(() => Promise.resolve([])),
  createEnrollment: jest.fn(() => Promise.resolve({}))
}));

jest.mock('../src/modules/payments/payments.service', () => ({
  create: jest.fn(() => Promise.resolve({ id: 'p1' }))
}));

const classService = require('../src/modules/classes/class.service');
const wishlistService = require('../src/modules/classes/wishlist/classWishlist.service');
const cartService = require('../src/modules/cart/cart.service');
const enrollmentService = require('../src/modules/classes/enrollments/classEnrollment.service');
const paymentsService = require('../src/modules/payments/payments.service');

describe.skip('Student class', () => {
  const student = new Student('user1');

  beforeEach(() => {
    jest.clearAllMocks();
    cartService._carts['user1'] = [];
  });

  test('discoverClasses calls class service', async () => {
    await student.discoverClasses();
    expect(classService.getPublishedClasses).toHaveBeenCalled();
  });

  test('checkout enrolls and pays', async () => {
    student.addToCart('c1', 10);
    const result = await student.checkout(1);
    expect(enrollmentService.createEnrollment).toHaveBeenCalled();
    expect(paymentsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ item_type: 'class', amount: 10 })
    );
    expect(result.length).toBe(1);
    expect(cartService.list('user1').length).toBe(0);
  });
});
