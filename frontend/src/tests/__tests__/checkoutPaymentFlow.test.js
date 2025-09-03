import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CheckoutPage from '../../pages/payments/checkout';
import { fetchClassDetails } from '../../services/classService';
import { fetchPaymentMethods } from '../../services/paymentMethodService';
import { initiateBankPayment } from '../../services/paymentService';
import { createPayment } from '../../services/student/paymentService';
import { fetchPlanDetails } from '../../services/public/planService';
import { validateCode } from '../../services/couponService';
import PaymentSuccessPage from '../../pages/payments/success';
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      const translations = {
        checkout: 'Checkout',
        bank_transfer_pending: 'Your bank transfer request has been submitted and is pending admin approval.',
          payment_reference_optional: 'Reference / Notes (optional)',
          payment_receipt_optional: 'Payment Receipt (optional)',
          bank_name: 'Bank Name',
          account_holder_name: 'Account Holder Name',
          account_number_iban: 'Account Number / IBAN',
          swift_code: 'SWIFT Code',
          branch_address: 'Branch Address',
      };
      if (key === 'pay_with_paypal') return `Pay $${params?.price} with PayPal`;
        if (key === 'pay_with_bank') return `Pay $${params?.price} with Bank`;
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
jest.mock('../../services/couponService', () => ({ validateCode: jest.fn() }));
jest.mock('../../services/paymentMethodService', () => ({
  fetchPaymentMethods: jest.fn(),
}));
jest.mock('../../services/instructor/subscriptionService', () => ({
  subscribeToPlan: jest.fn(),
}));
jest.mock('../../components/payments/forms/CardPaymentForm', () => {
  return function MockCardForm({ onSubmit, finalPrice, selectedMethodLabel }) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          global.mockStripeCreateToken();
          onSubmit({ token: 'tok_123', name: 'John Doe', email: 'john@example.com' });
        }}
      >
        <input placeholder="Full Name" />
        <input placeholder="Email Address" />
        <input placeholder="Card Number" />
        <input placeholder="Expiration Date (MM/YY)" />
        <input placeholder="CVC" />
        <div data-testid="card-element" />
        <button type="submit">{`Pay $${finalPrice} with ${selectedMethodLabel}`}</button>
      </form>
    );
  };
});
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
  global.mockStripeCreateToken.mockResolvedValue({ token: { id: 'tok_123' } });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders payment logos using library icons with url fallback', async () => {
  fetchPaymentMethods.mockResolvedValue([
    { id: 1, name: 'Stripe', type: 'stripe', icon: 'https://skillbridge.com/stripe.png' },
    { id: 2, name: 'PayPal', type: null },
    { id: 3, name: 'Custom', type: 'custom', icon: 'https://skillbridge.com/custom.png' },
  ]);
  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  const stripeIcon = screen.getByTestId('payment-icon-stripe').querySelector('svg');
  expect(stripeIcon).not.toBeNull();
  const paypalIcon = screen.getByTestId('payment-icon-paypal').querySelector('svg');
  expect(paypalIcon).not.toBeNull();
  const customIcon = screen.getByTestId('payment-icon-custom').querySelector('img');
  expect(customIcon).toHaveAttribute('src', 'https://skillbridge.com/custom.png');
});

test('adjusts inputs based on payment selection and submits bank reference', async () => {
  const push = jest.fn();
  mockUseRouter.mockReturnValue({
    query: { itemId: '1', itemType: 'class' },
    isReady: true,
    push,
  });
  fetchPaymentMethods.mockResolvedValue([
    { id: 1, name: 'Stripe', type: 'stripe' },
    { id: 2, name: 'PayPal', type: null },
    {
      id: 3,
      name: 'Bank',
      type: 'bank',
      config: { bank_name: 'Test Bank', account_holder_name: 'John', account_number: '123', swift_code: 'ABCDEF' },
    },
  ]);
  initiateBankPayment.mockResolvedValue({ id: 42 });
  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  expect(screen.getByTestId('card-element')).toBeInTheDocument();
  fireEvent.click(screen.getByText('PayPal'));
  expect(screen.queryByTestId('card-element')).toBeNull();
  expect(screen.getByRole('button', { name: /Pay \$100 with PayPal/i })).toBeInTheDocument();
  fireEvent.click(screen.getByText('Bank'));
  expect(screen.queryByTestId('card-element')).toBeNull();
  expect(screen.getByDisplayValue('Test Bank')).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText(/Reference/), { target: { value: 'ref' } });
  fireEvent.click(screen.getByRole('button', { name: /Pay \$100 with Bank/i }));
  await waitFor(() => expect(initiateBankPayment).toHaveBeenCalled());
  await waitFor(() =>
    expect(push).toHaveBeenCalledWith(
      '/payments/success?itemType=class&itemId=1&payment_id=42'
    )
  );
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
  fireEvent.click(screen.getByRole('button', { name: /Pay \$100 with Stripe/i }));
  await waitFor(() => expect(global.mockStripeCreateToken).toHaveBeenCalled());
  await waitFor(() => expect(createPayment).toHaveBeenCalledWith(expect.objectContaining({ token: 'tok_123' })));
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
  fireEvent.click(screen.getByRole('button', { name: /Pay \$100 with Stripe/i }));
  await waitFor(() => expect(global.mockStripeCreateToken).toHaveBeenCalled());
  await waitFor(() => expect(createPayment).toHaveBeenCalledWith(expect.objectContaining({ token: 'tok_123' })));
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
  validateCode.mockResolvedValue({ id: 7, discount_percent: 10 });

  render(<CheckoutPage />);
  await screen.findByText('Checkout');

  fireEvent.change(screen.getByPlaceholderText('enter_promo_code'), {
    target: { value: 'SAVE' },
  });
  await act(async () => {
    fireEvent.click(screen.getByText('apply'));
  });
  await waitFor(() =>
    expect(validateCode).toHaveBeenCalledWith('SAVE', 'plan', '1')
  );

  const payButton = await screen.findByRole('button', { name: /Pay \$45 with Stripe/i });
  fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'jane@example.com' } });
  fireEvent.click(payButton);

  await waitFor(() => expect(global.mockStripeCreateToken).toHaveBeenCalled());
  await waitFor(() =>
    expect(createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'tok_123', coupon_id: 7 })
    )
  );
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

test('shows available payment methods for plans', async () => {
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
    { id: 4, name: 'USDT', type: 'usdt' },
  ]);

  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  expect(screen.queryByText('PayPal')).toBeNull();
  expect(screen.queryByText('Bank')).toBeNull();
  expect(await screen.findByText('Stripe')).toBeInTheDocument();
});

test('shows error when no payment method matches selection', async () => {
  fetchPaymentMethods.mockResolvedValue([]);

  render(<CheckoutPage />);
  await screen.findByText('Checkout');

  fireEvent.change(screen.getByPlaceholderText('Full Name'), {
    target: { value: 'John Doe' },
  });
  fireEvent.change(screen.getByPlaceholderText('Email Address'), {
    target: { value: 'john@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('Card Number'), {
    target: { value: '4242424242424242' },
  });
  fireEvent.change(screen.getByPlaceholderText('Expiration Date (MM/YY)'), {
    target: { value: '12/30' },
  });
  fireEvent.change(screen.getByPlaceholderText('CVC'), {
    target: { value: '123' },
  });

  fireEvent.click(screen.getByRole('button', { name: /Pay \$100 with/i }));

  await waitFor(() =>
    expect(require('react-toastify').toast.error).toHaveBeenCalledWith(
      'payment_method_missing'
    )
  );
  expect(createPayment).not.toHaveBeenCalled();
});
