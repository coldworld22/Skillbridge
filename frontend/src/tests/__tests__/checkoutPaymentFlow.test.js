import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutPage from '../../pages/payments/checkout';
import { fetchClassDetails } from '../../services/classService';
import { fetchPaymentMethods } from '../../services/paymentMethodService';
import { initiateBankPayment } from '../../services/paymentService';
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      const translations = {
        checkout: 'Checkout',
        bank_transfer_pending: 'Your bank transfer request has been submitted and is pending admin approval.',
      };
      if (key === 'pay_with_paypal') return `Pay $${params?.price} with PayPal`;
      return translations[key] || key;
    },
  }),
}));

jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mockRemoveItem = jest.fn();
jest.mock('../../store/cart/cartStore', () => ({
  __esModule: true,
  default: (selector) => selector({ items: [], removeItem: mockRemoveItem }),
}));

jest.mock('../../components/website/sections/Navbar', () => {
  function MockNavbar() { return <div />; }
  MockNavbar.displayName = 'Navbar';
  return MockNavbar;
});
jest.mock('../../components/website/sections/Footer', () => {
  function MockFooter() { return <div />; }
  MockFooter.displayName = 'Footer';
  return MockFooter;
});

jest.mock('../../services/classService', () => ({ fetchClassDetails: jest.fn() }));
jest.mock('../../services/tutorialService', () => ({ fetchTutorialDetails: jest.fn() }));
jest.mock('../../services/paymentMethodService', () => ({
  fetchPaymentMethods: jest.fn(),
}));
jest.mock('../../services/paymentService', () => ({
  initiateBankPayment: jest.fn(),
  initiateCryptoPayment: jest.fn(),
  initiatePayPalPayment: jest.fn(),
}));

const mockUseRouter = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => mockUseRouter() }));

beforeEach(() => {
  mockUseRouter.mockReturnValue({
    query: { itemId: '1', itemType: 'class' },
    isReady: true,
    push: jest.fn(),
  });
  fetchClassDetails.mockResolvedValue({
    data: { id: 1, title: 'Test Class', instructor: 'Inst', price: 100, cover_image: '' },
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders payment logos from url and fallback', async () => {
  fetchPaymentMethods.mockResolvedValue([
    { id: 1, name: 'Stripe', type: 'stripe', icon: 'https://example.com/stripe.png' },
    { id: 2, name: 'PayPal', type: null },
  ]);
  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  const stripeIcon = screen.getByTestId('payment-icon-stripe').querySelector('img');
  expect(stripeIcon).toHaveAttribute('src', 'https://example.com/stripe.png');
  const paypalIcon = screen.getByTestId('payment-icon-paypal').querySelector('svg');
  expect(paypalIcon).not.toBeNull();
});

test('adjusts inputs based on payment selection and submits bank details', async () => {
  fetchPaymentMethods.mockResolvedValue([
    { id: 1, name: 'Stripe', type: 'stripe' },
    { id: 2, name: 'PayPal', type: null },
    { id: 3, name: 'Bank', type: 'bank' },
  ]);
  initiateBankPayment.mockResolvedValue({});
  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  expect(screen.getByPlaceholderText('Card Number')).toBeInTheDocument();
  fireEvent.click(screen.getByText('PayPal'));
  expect(screen.queryByPlaceholderText('Card Number')).toBeNull();
  expect(screen.getByRole('button', { name: /Pay \$100 with PayPal/i })).toBeInTheDocument();
  fireEvent.click(screen.getByText('Bank'));
  expect(screen.queryByPlaceholderText('Card Number')).toBeNull();
  expect(screen.getByPlaceholderText('Bank Name')).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('Bank Name'), { target: { value: 'Test Bank' } });
  fireEvent.change(screen.getByPlaceholderText('Account Holder Name'), { target: { value: 'John' } });
  fireEvent.change(screen.getByPlaceholderText('Account Number / IBAN'), { target: { value: '123' } });
  fireEvent.change(screen.getByPlaceholderText('SWIFT Code'), { target: { value: 'ABCDEF' } });
  fireEvent.click(screen.getByRole('button', { name: /Pay \$100 with Bank/i }));
  await waitFor(() => expect(initiateBankPayment).toHaveBeenCalled());
  expect(await screen.findByText(/bank transfer request has been submitted/i)).toBeInTheDocument();
});
