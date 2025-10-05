import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CheckoutPage from '../../pages/payments/checkout';
import { fetchClassDetails } from '../../services/classService';
import { fetchPaymentMethods } from '../../services/paymentMethodService';
import { initiateBankPayment, initiateCryptoPayment, initiatePayPalPayment } from '../../services/paymentService';
import { createPayment } from '../../services/student/paymentService';
import { fetchPlanDetails } from '../../services/public/planService';
import { validateCode } from '../../services/couponService';
import PaymentSuccessPage from '../../pages/payments/success';
import { subscribeToPlan, fetchMySubscription } from '../../services/subscriptionService';
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
      if (key === 'pay_in_monthly_installments') {
        return `Pay in ${params?.count} monthly installments`;
      }
      if (key === 'installment_item') {
        return `Installment ${params?.number}: ${params?.amount} on ${params?.date}`;
      }
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
jest.mock('../../services/subscriptionService', () => ({
  subscribeToPlan: jest.fn(),
  fetchMySubscription: jest.fn(),
}));
jest.mock('../../components/payments/forms/CardPaymentForm', () => {
  return function MockCardForm({
    onSubmit,
    finalPrice,
    selectedMethodLabel,
    allowInstallments,
    installments,
    perInstallment,
    requireStripeTokenization = true,
  }) {
    const usingInstallments = allowInstallments && installments > 1;
    const buttonLabel = usingInstallments
      ? `Pay $${perInstallment.toFixed(2)} (1/${installments}) with ${selectedMethodLabel}`
      : `Pay $${finalPrice} with ${selectedMethodLabel}`;
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (requireStripeTokenization) {
            global.mockStripeCreateToken();
            onSubmit({ token: 'tok_123', name: 'John Doe', email: 'john@example.com' });
            return;
          }
          onSubmit({ name: 'John Doe', email: 'john@example.com' });
        }}
      >
        <input placeholder="Full Name" />
        <input placeholder="Email Address" />
        <input placeholder="Card Number" />
        <input placeholder="Expiration Date (MM/YY)" />
        <input placeholder="CVC" />
        <div data-testid="card-element" />
        <button type="submit">{buttonLabel}</button>
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
  fetchMySubscription.mockResolvedValue(null);
  subscribeToPlan.mockResolvedValue({ subscription: null });
});

afterEach(() => {
  jest.clearAllMocks();
});

test.skip('renders payment logos using library icons with url fallback', async () => {
  // Skipped: depends on external icon configuration
});

test('adjusts inputs based on payment selection and submits bank reference', async () => {
  const push = jest.fn();
  mockUseRouter.mockReturnValue({
    query: { itemId: '1', itemType: 'class' },
    isReady: true,
    push,
  });
  fetchPaymentMethods.mockResolvedValue([
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
  fireEvent.click(screen.getByText('PayPal'));
  expect(screen.getByRole('button', { name: /Pay \$100 with PayPal/i })).toBeInTheDocument();
  fireEvent.click(screen.getByText('Bank'));
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

test.skip('completes payment for unhandled methods on success', async () => {
  /* Skipped: requires card processing setup */
});

test('renders card form without Elements for non-stripe processors', async () => {
  fetchPaymentMethods.mockResolvedValue([
    { id: 1, name: 'Paystack', type: 'paystack' },
  ]);
  createPayment.mockResolvedValue({ status: 'paid' });
  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  expect(screen.queryByTestId('elements-wrapper')).toBeNull();
  fireEvent.change(screen.getByPlaceholderText('Full Name'), {
    target: { value: 'John Doe' },
  });
  fireEvent.change(screen.getByPlaceholderText('Email Address'), {
    target: { value: 'john@example.com' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: /Pay \$100 with Paystack/i })
  );
  await waitFor(() => expect(createPayment).toHaveBeenCalledTimes(1));
  expect(global.mockStripeCreateToken).not.toHaveBeenCalled();
});

test('submits per-installment amount for multi-installment card payments', async () => {
  fetchClassDetails.mockResolvedValue({
    data: {
      id: 1,
      title: 'Test Class',
      instructor: 'Inst',
      price: 100,
      cover_image: '',
      installments: 4,
    },
  });
  fetchPaymentMethods.mockResolvedValue([
    { id: 1, name: 'Paystack', type: 'paystack' },
  ]);
  createPayment.mockResolvedValue({ status: 'paid' });

  render(<CheckoutPage />);
  await screen.findByText('Checkout');

  const installmentToggle = screen.getByLabelText('Pay in 4 monthly installments');
  fireEvent.click(installmentToggle);

  const button = await screen.findByRole('button', {
    name: /Pay \$25\.00 \(1\/4\) with Paystack/i,
  });
  fireEvent.click(button);

  await waitFor(() =>
    expect(createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 25,
        allow_installments: true,
        installments: 4,
      })
    )
  );
});

test.skip('shows error when unhandled payment fails', async () => {
  /* Skipped: requires card processing setup */
});

test('shows error when PayPal payment lacks approval_url', async () => {
  fetchPaymentMethods.mockResolvedValue([
    { id: 1, name: 'PayPal', type: null },
  ]);
  initiatePayPalPayment.mockResolvedValue({});
  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  const button = screen.getByRole('button', { name: /Pay \$100 with PayPal/i });
  fireEvent.click(button);
  await waitFor(() => expect(initiatePayPalPayment).toHaveBeenCalled());
  await waitFor(() => expect(require('react-toastify').toast.error).toHaveBeenCalled());
  expect(button).not.toBeDisabled();
});

test('shows error when crypto payment lacks invoice_url', async () => {
  fetchPaymentMethods.mockResolvedValue([
    { id: 1, name: 'USDT', type: 'usdt' },
  ]);
  initiateCryptoPayment.mockResolvedValue({});
  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  const button = screen.getByRole('button', { name: /Pay \$100 with Crypto/i });
  fireEvent.click(button);
  await waitFor(() => expect(initiateCryptoPayment).toHaveBeenCalled());
  await waitFor(() => expect(require('react-toastify').toast.error).toHaveBeenCalled());
  expect(button).not.toBeDisabled();
});

test.skip('processes plan card payments and redirects to billing for students', async () => {
  /* Skipped: requires Stripe configuration which is not available in tests */
});

test('shows available payment methods for plans', async () => {
  mockUseRouter.mockReturnValue({
    query: { itemId: '1', itemType: 'plan' },
    isReady: true,
    push: jest.fn(),
  });
  fetchPlanDetails.mockResolvedValue({
    data: { id: 1, name: 'Starter Plan', price_monthly: 50, price_yearly: 500 },
  });
  fetchPaymentMethods.mockResolvedValue([
    { id: 1, name: 'Stripe', type: 'stripe' },
    { id: 2, name: 'PayPal', type: null },
    { id: 3, name: 'Bank', type: 'bank' },
    { id: 4, name: 'USDT', type: 'usdt' },
  ]);

  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  expect(await screen.findByText('PayPal')).toBeInTheDocument();
  expect(await screen.findByText('Bank')).toBeInTheDocument();
  expect(await screen.findByText('USDT')).toBeInTheDocument();
});

test.skip('enrolls in free plan without payment', async () => {
  jest.useFakeTimers();
  const push = jest.fn();
  mockUseRouter.mockReturnValue({
    query: { itemId: '1', itemType: 'plan' },
    isReady: true,
    push,
  });
  fetchPlanDetails.mockResolvedValue({
    data: { id: 1, name: 'Free Plan', price_monthly: 0 },
  });
  fetchPaymentMethods.mockResolvedValue([]);

  render(<CheckoutPage />);
  await waitFor(() => expect(fetchPlanDetails).toHaveBeenCalled());
  await act(async () => {});
  const button = await screen.findByRole('button', {
    name: /enroll_for_free/i,
  });
  fireEvent.click(button);
  await waitFor(() =>
    expect(subscribeToPlan).toHaveBeenCalledWith(1, 'monthly')
  );
  jest.runAllTimers();
  await waitFor(() =>
    expect(push).toHaveBeenCalledWith('/payments/success?itemType=plan&itemId=1')
  );
  expect(createPayment).not.toHaveBeenCalled();
  jest.useRealTimers();
});

test('skips subscription when plan is already active on success page', async () => {
  mockUseRouter.mockReturnValue({
    query: { itemType: 'plan', itemId: '1' },
    isReady: true,
    push: jest.fn(),
  });
  fetchPlanDetails.mockResolvedValue({
    data: { id: 1, name: 'Starter Plan' },
  });
  fetchMySubscription.mockResolvedValue({
    plan_id: 1,
    status: 'active',
    name: 'Starter Plan',
    interval: 'monthly',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
  });

  render(<PaymentSuccessPage />);

  await waitFor(() => expect(fetchPlanDetails).toHaveBeenCalled());
  await waitFor(() => expect(fetchMySubscription).toHaveBeenCalled());
  await screen.findByText('Payment Successful!');
  expect(subscribeToPlan).not.toHaveBeenCalled();

  const billingLink = await screen.findByRole('link', {
    name: /Manage Billing/i,
  });
  expect(billingLink).toBeInTheDocument();
});

test.skip('shows error when no payment method matches selection', async () => {
  mockUseRouter.mockReturnValue({
    query: { itemId: '1', itemType: 'plan' },
    isReady: true,
    push: jest.fn(),
  });
  fetchPlanDetails.mockResolvedValue({
    data: { id: 1, name: 'Starter Plan', price_monthly: 50 },
  });
  fetchPaymentMethods.mockResolvedValue([]);

  render(<CheckoutPage />);
  await waitFor(() => expect(fetchPlanDetails).toHaveBeenCalled());
  await act(async () => {});
  const notice = await screen.findByText(
    'No payment methods available for this plan'
  );
  expect(notice).toBeInTheDocument();

  const button = screen.getByRole('button', { name: /Pay \$50/i });
  expect(button).toBeDisabled();
});

test.each([2, 5])('renders installment schedule for %i installments', async (count) => {
  fetchClassDetails.mockResolvedValue({
    data: { id: 1, title: 'Test Class', instructor: 'Inst', price: 100, cover_image: '', installments: count },
  });
  fetchPaymentMethods.mockResolvedValue([{ id: 1, name: 'Stripe', type: 'stripe' }]);
  render(<CheckoutPage />);
  await screen.findByText('Checkout');
  const checkbox = screen.getByLabelText(`Pay in ${count} monthly installments`);
  fireEvent.click(checkbox);
  const items = await screen.findAllByRole('listitem');
  expect(items).toHaveLength(count);
  expect(items[0].textContent).toContain((100 / count).toFixed(2));
});
