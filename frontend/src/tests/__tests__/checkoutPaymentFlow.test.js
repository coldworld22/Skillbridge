import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutPage from '../../pages/payments/checkout';
import { fetchClassDetails } from '../../services/classService';
import { fetchPaymentMethods } from '../../services/paymentMethodService';
import { initiateBankPayment } from '../../services/paymentService';
import { createPayment } from '../../services/student/paymentService';
import { fetchPlanDetails } from '../../services/public/planService';
import PaymentSuccessPage from '../../pages/payments/success';
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      const translations = {
        checkout: 'Checkout',
        bank_transfer_pending: 'Your bank transfer request has been submitted and is pending admin approval.',
      };
      if (key === 'pay_with_paypal') return `Pay $${params?.price} with PayPal`;
      if (typeof params === 'string') return params;
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
jest.mock('../../services/public/planService', () => ({ fetchPlanDetails: jest.fn() }));
jest.mock('../../services/paymentMethodService', () => ({
  fetchPaymentMethods: jest.fn(),
}));
jest.mock('../../services/paymentService', () => ({
  initiateBankPayment: jest.fn(),
  initiateCryptoPayment: jest.fn(),
  initiatePayPalPayment: jest.fn(),
}));
jest.mock('../../services/student/paymentService', () => ({
  createPayment: jest.fn(),
}));
jest.mock('../../store/libraryStore', () => ({
  __esModule: true,
  default: (selector) => {
    const state = { fetchLibrary: jest.fn().mockResolvedValue() };
    return typeof selector === 'function' ? selector(state) : state;
  },
}));

const mockUseRouter = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => mockUseRouter() }));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>,
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
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders payment logos using library icons with url fallback', async () => {
  fetchPaymentMethods.mockResolvedValue([
    { id: 1, name: 'Stripe', type: 'stripe', icon: 'https://example.com/stripe.png' },
    { id: 2, name: 'PayPal', type: null },
    { id: 3, name: 'Custom', type: 'custom', icon: 'https://example.com/custom.png' },
  ]);
  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  const stripeIcon = screen.getByTestId('payment-icon-stripe').querySelector('svg');
  expect(stripeIcon).not.toBeNull();
  const paypalIcon = screen.getByTestId('payment-icon-paypal').querySelector('svg');
  expect(paypalIcon).not.toBeNull();
  const customIcon = screen.getByTestId('payment-icon-custom').querySelector('img');
  expect(customIcon).toHaveAttribute('src', 'https://example.com/custom.png');
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

test('completes payment for unhandled methods on success', async () => {
  fetchPaymentMethods.mockResolvedValue([
    { id: 1, name: 'Stripe', type: 'stripe' },
  ]);
  createPayment.mockResolvedValue({ status: 'paid' });
  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'John Doe' } });
  fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'john@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Card Number'), { target: { value: '4242424242424242' } });
  fireEvent.change(screen.getByPlaceholderText('Expiration Date (MM/YY)'), { target: { value: '12/30' } });
  fireEvent.change(screen.getByPlaceholderText('CVC'), { target: { value: '123' } });
  fireEvent.click(screen.getByRole('button', { name: /Pay \$100 with Stripe/i }));
  await waitFor(() => expect(createPayment).toHaveBeenCalled());
  expect(await screen.findByText(/payment_successful_redirecting/i)).toBeInTheDocument();
});

test('shows error when unhandled payment fails', async () => {
  fetchPaymentMethods.mockResolvedValue([
    { id: 1, name: 'Stripe', type: 'stripe' },
  ]);
  createPayment.mockRejectedValue(new Error('fail'));
  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'John Doe' } });
  fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'john@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Card Number'), { target: { value: '4242424242424242' } });
  fireEvent.change(screen.getByPlaceholderText('Expiration Date (MM/YY)'), { target: { value: '12/30' } });
  fireEvent.change(screen.getByPlaceholderText('CVC'), { target: { value: '123' } });
  fireEvent.click(screen.getByRole('button', { name: /Pay \$100 with Stripe/i }));
  await waitFor(() => expect(createPayment).toHaveBeenCalled());
  expect(require('react-toastify').toast.error).toHaveBeenCalled();
});

test('processes plan card payments and redirects to billing for students', async () => {
  jest.useFakeTimers();
  const push = jest.fn();
  mockUseRouter.mockReturnValue({
    query: { itemId: '1', itemType: 'plan' },
    isReady: true,
    push,
  });
  const planDetails = { data: { id: 1, name: 'Starter Plan', price_monthly: 50 } };
  fetchPlanDetails.mockResolvedValue(planDetails);
  fetchPaymentMethods.mockResolvedValue([{ id: 1, name: 'Stripe', type: 'stripe' }]);
  createPayment.mockResolvedValue({ status: 'paid' });

  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  expect(
    screen.getByText(
      'Bank transfer, PayPal, and cryptocurrency payment methods are not available for plans.'
    )
  ).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Card Number'), { target: { value: '4242424242424242' } });
  fireEvent.change(screen.getByPlaceholderText('Expiration Date (MM/YY)'), { target: { value: '12/30' } });
  fireEvent.change(screen.getByPlaceholderText('CVC'), { target: { value: '123' } });
  fireEvent.click(screen.getByRole('button', { name: /Pay \$50 with Stripe/i }));

  await waitFor(() => expect(createPayment).toHaveBeenCalled());
  jest.runAllTimers();
  await waitFor(() =>
    expect(push).toHaveBeenCalledWith('/payments/success?itemType=plan&itemId=1')
  );
  jest.useRealTimers();

  mockUseRouter.mockReturnValue({
    query: { itemType: 'plan', itemId: '1' },
  });
  fetchPlanDetails.mockResolvedValue(planDetails);
  render(<PaymentSuccessPage />);
  const billingLink = await screen.findByRole('link', { name: /Manage Billing/i });
  expect(billingLink).toHaveAttribute('href', '/dashboard/student/settings?tab=billing');
});

test('filters out bank and PayPal methods for plans', async () => {
  mockUseRouter.mockReturnValue({
    query: { itemId: '1', itemType: 'plan' },
    isReady: true,
    push: jest.fn(),
  });
  fetchPlanDetails.mockResolvedValue({
    data: { id: 1, name: 'Starter Plan', price_monthly: 50 },
  });
  fetchPaymentMethods.mockResolvedValue([
    { id: 1, name: 'Stripe', type: 'stripe' },
    { id: 2, name: 'PayPal', type: null },
    { id: 3, name: 'Bank', type: 'bank' },
  ]);

  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  expect(
    screen.getByText(
      'Bank transfer, PayPal, and cryptocurrency payment methods are not available for plans.'
    )
  ).toBeInTheDocument();
  expect(screen.queryByText('PayPal')).toBeNull();
  expect(screen.queryByText('Bank')).toBeNull();
  expect(screen.getByText('Stripe')).toBeInTheDocument();
});
