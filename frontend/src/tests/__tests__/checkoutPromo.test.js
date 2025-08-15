import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutPage from '../../pages/payments/checkout';
import { validateCode } from '../../services/couponService';
import { fetchClassDetails } from '../../services/classService';
import { fetchPaymentMethods, fetchPayPalClientId } from '../../services/paymentMethodService';

const mockRemoveItem = jest.fn();
jest.mock('../../store/cart/cartStore', () => ({
  __esModule: true,
  default: (selector) => selector({ items: [], removeItem: mockRemoveItem }),
}));

jest.mock('../../components/website/sections/Navbar', () => () => <div />);
jest.mock('../../components/website/sections/Footer', () => () => <div />);

jest.mock('../../services/classService', () => ({
  fetchClassDetails: jest.fn(),
}));

jest.mock('../../services/tutorialService', () => ({
  fetchTutorialDetails: jest.fn(),
}));

jest.mock('../../services/paymentMethodService', () => ({
  fetchPaymentMethods: jest.fn(),
  fetchPayPalClientId: jest.fn(),
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
  fetchPayPalClientId.mockResolvedValue('');
});

afterEach(() => {
  jest.clearAllMocks();
});

test('applies promo code successfully', async () => {
  validateCode.mockResolvedValue({ discount_percent: 10 });
  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  fireEvent.change(screen.getByPlaceholderText('Enter promo code'), {
    target: { value: 'SAVE10' },
  });
  fireEvent.click(screen.getByText('Apply'));
  await waitFor(() => expect(validateCode).toHaveBeenCalledWith('SAVE10'));
  expect(await screen.findByText('Discount Applied: -$10')).toBeInTheDocument();
  expect(screen.queryByText('Invalid promo code')).toBeNull();
});

test('shows error for invalid promo code', async () => {
  validateCode.mockRejectedValue({ response: { status: 400 } });
  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  fireEvent.change(screen.getByPlaceholderText('Enter promo code'), {
    target: { value: 'BADCODE' },
  });
  fireEvent.click(screen.getByText('Apply'));
  expect(await screen.findByText('Invalid promo code')).toBeInTheDocument();
});

test('handles network failure when applying promo code', async () => {
  validateCode.mockRejectedValue(new Error('Network Error'));
  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  fireEvent.change(screen.getByPlaceholderText('Enter promo code'), {
    target: { value: 'SAVE10' },
  });
  fireEvent.click(screen.getByText('Apply'));
  expect(
    await screen.findByText('Failed to apply promo code. Please try again.')
  ).toBeInTheDocument();
});
