import { addTutorialToCart } from '../../pages/tutorials/[id]';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const toast = require('react-hot-toast').default;

describe('addTutorialToCart helper', () => {
  const baseTutorial = {
    id: 1,
    title: 'Test Tutorial',
    price: 20,
    discountPrice: null,
    currency: 'USD',
  };
  const router = { push: jest.fn() };
  const t = (key) => key;

  beforeEach(() => {
    jest.clearAllMocks();
    router.push.mockReset();
  });

  it('shows toast when tutorial already exists in cart', async () => {
    const addItem = jest.fn();
    await addTutorialToCart({
      tutorial: baseTutorial,
      isLoggedIn: true,
      userRole: 'student',
      cartItems: [{ id: 1 }],
      addItem,
      router,
      t,
    });

    expect(addItem).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Already in cart');
  });

  it('adds tutorial to cart with tutorial item_type', async () => {
    const addItem = jest.fn().mockResolvedValue(true);
    await addTutorialToCart({
      tutorial: baseTutorial,
      isLoggedIn: true,
      userRole: 'student',
      cartItems: [],
      addItem,
      router,
      t,
    });

    expect(addItem).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, item_type: 'tutorial' }),
    );
    expect(toast.success).toHaveBeenCalledWith('Added to cart');
  });
});
