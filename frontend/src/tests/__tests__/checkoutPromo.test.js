import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutPage from '../../pages/payments/checkout';
import { validateCode } from '../../services/couponService';
import { fetchClassDetails } from '../../services/classService';
import { fetchPaymentMethods } from '../../services/paymentMethodService';
jest.mock('next-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mockRemoveItem = jest.fn();
jest.mock('../../store/cart/cartStore', () => ({
  __esModule: true,
  default: (selector) => selector({ items: [], removeItem: mockRemoveItem }),
}));

jest.mock('../../components/website/sections/Navbar', () => {
  function MockNavbar() {
    return <div />;
  }
  MockNavbar.displayName = 'Navbar';
  return MockNavbar;
});
jest.mock('../../components/website/sections/Footer', () => {
  function MockFooter() {
    return <div />;
  }
  MockFooter.displayName = 'Footer';
  return MockFooter;
});

jest.mock('../../services/classService', () => ({
  fetchClassDetails: jest.fn(),
}));

jest.mock('../../services/tutorialService', () => ({
  fetchTutorialDetails: jest.fn(),
}));

jest.mock('../../services/paymentMethodService', () => ({
  fetchPaymentMethods: jest.fn(),
}));

jest.mock('../../services/couponService', () => ({
  validateCode: jest.fn(),
}));

const mockUseRouter = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter(),
}));

beforeEach(() => {
  mockUseRouter.mockReturnValue({
    query: { itemId: '1', itemType: 'class' },
    isReady: true,
    push: jest.fn(),
  });
  fetchClassDetails.mockResolvedValue({
    data: { id: 1, title: 'Test Class', instructor: 'Inst', price: 100, cover_image: '' },
  });
  fetchPaymentMethods.mockResolvedValue([
    { name: 'stripe', label: 'Stripe', icon: 'stripe', active: true },
  ]);
});

afterEach(() => {
  jest.clearAllMocks();
});

test('applies promo code successfully', async () => {
  validateCode.mockResolvedValue({ discount_percent: 10 });
  render(<CheckoutPage />);
  await screen.findByText('checkout');
  fireEvent.change(screen.getByPlaceholderText('enter_promo_code'), {
    target: { value: 'SAVE10' },
  });
  fireEvent.click(screen.getByText('apply'));
  await waitFor(() => expect(validateCode).toHaveBeenCalledWith('SAVE10', 'class', '1'));
  expect(await screen.findByText(/Discount Applied/i)).toBeInTheDocument();
  const { toast } = require('react-toastify');
  expect(toast.success).toHaveBeenCalledWith('promo_code_applied');
});

test('shows error for invalid promo code', async () => {
  validateCode.mockRejectedValue({ response: { status: 404 } });
  render(<CheckoutPage />);
  await screen.findByText('checkout');
  fireEvent.change(screen.getByPlaceholderText('enter_promo_code'), {
    target: { value: 'BADCODE' },
  });
  fireEvent.click(screen.getByText('apply'));
  const { toast } = require('react-toastify');
  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('invalid_promo_code');
  });
});

test('handles network failure when applying promo code', async () => {
  validateCode.mockRejectedValue(new Error('Network Error'));
  render(<CheckoutPage />);
  await screen.findByText('checkout');
  fireEvent.change(screen.getByPlaceholderText('enter_promo_code'), {
    target: { value: 'SAVE10' },
  });
  fireEvent.click(screen.getByText('apply'));
  const { toast } = require('react-toastify');
  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('promo_code_apply_failed');
  });
});
