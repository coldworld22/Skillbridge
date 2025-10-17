import {
  handleBankPayment,
  handlePayPalPayment,
  handleCryptoPayment,
  handleDefaultPayment,
} from '../../pages/payments/checkout';
import {
  initiateBankPayment,
  initiatePayPalPayment,
  initiateCryptoPayment,
  initiateCoinbasePayment,
} from '../../services/paymentService';
import { createPayment } from '../../services/student/paymentService';
import { toast } from 'react-toastify';

jest.mock('../../services/paymentService', () => ({
  initiateBankPayment: jest.fn(),
  initiatePayPalPayment: jest.fn(),
  initiateCryptoPayment: jest.fn(),
  initiateCoinbasePayment: jest.fn(),
}));

jest.mock('../../services/student/paymentService', () => ({
  createPayment: jest.fn(),
}));

jest.mock('react-toastify', () => ({ toast: { error: jest.fn() } }));

const baseArgs = () => ({
  itemInfo: { id: 1 },
  itemType: 'class',
  finalPrice: 100,
  couponId: null,
  router: { push: jest.fn() },
  t: (k) => k,
  setPaymentStatus: jest.fn(),
  allowInstallments: false,
  installments: 1,
  interval: 'monthly',
  formData: {},
  method: { id: 2, type: 'stripe' },
  completePayment: jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
  delete window.location;
  window.location = { href: '' };
});

test('bank payment redirects on success and handles errors for plan', async () => {
  initiateBankPayment.mockResolvedValue({ id: 55 });
  const args = { ...baseArgs(), itemType: 'plan' };
  await handleBankPayment(args);
  expect(initiateBankPayment).toHaveBeenCalled();
  expect(args.router.push).toHaveBeenCalledWith(
    '/payments/success?itemType=plan&itemId=1&payment_id=55'
  );

  initiateBankPayment.mockRejectedValue(new Error('fail'));
  const errArgs = { ...baseArgs(), itemType: 'plan' };
  await handleBankPayment(errArgs);
  expect(toast.error).toHaveBeenCalled();
  expect(errArgs.setPaymentStatus).toHaveBeenCalledWith('idle');
});

test('paypal payment redirects on approval url and handles errors', async () => {
  initiatePayPalPayment.mockResolvedValue({ approval_url: 'http://paypal' });
  await handlePayPalPayment(baseArgs());
  expect(window.location.href).toBe('http://paypal');

  initiatePayPalPayment.mockResolvedValue({});
  const args = baseArgs();
  await handlePayPalPayment(args);
  expect(toast.error).toHaveBeenCalled();
  expect(args.setPaymentStatus).toHaveBeenCalledWith('idle');
});

test('crypto payment redirects to invoice and handles errors', async () => {
  initiateCryptoPayment.mockResolvedValue({ invoice_url: 'http://invoice' });
  const args = { ...baseArgs(), method: { type: 'usdt' } };
  await handleCryptoPayment(args);
  expect(window.location.href).toBe('http://invoice');

  initiateCryptoPayment.mockResolvedValue({});
  await handleCryptoPayment(args);
  expect(toast.error).toHaveBeenCalled();
  expect(args.setPaymentStatus).toHaveBeenCalledWith('idle');
});

test('coinbase payment redirects when hosted url provided', async () => {
  initiateCoinbasePayment.mockResolvedValue({ hosted_url: 'http://coinbase' });
  const args = { ...baseArgs(), method: { type: 'coinbase' } };
  await handleCryptoPayment(args);
  expect(window.location.href).toBe('http://coinbase');

  initiateCoinbasePayment.mockResolvedValue({});
  await handleCryptoPayment(args);
  expect(toast.error).toHaveBeenCalled();
  expect(args.setPaymentStatus).toHaveBeenCalledWith('idle');
});

test('includes interval for plan payments', async () => {
  // Bank
  initiateBankPayment.mockResolvedValue({ id: 55 });
  const bankArgs = { ...baseArgs(), itemType: 'plan', interval: 'yearly' };
  await handleBankPayment(bankArgs);
  const formData = initiateBankPayment.mock.calls[0][0];
  expect(formData.get('interval')).toBe('yearly');

  // PayPal
  initiatePayPalPayment.mockResolvedValue({ approval_url: 'http://paypal' });
  const paypalArgs = { ...baseArgs(), itemType: 'plan', interval: 'monthly' };
  await handlePayPalPayment(paypalArgs);
  expect(initiatePayPalPayment).toHaveBeenLastCalledWith(
    expect.objectContaining({ interval: 'monthly' })
  );

  // Crypto
  initiateCryptoPayment.mockResolvedValue({ invoice_url: 'http://invoice' });
  const cryptoArgs = {
    ...baseArgs(),
    itemType: 'plan',
    interval: 'monthly',
    method: { type: 'usdt' },
  };
  await handleCryptoPayment(cryptoArgs);
  expect(initiateCryptoPayment).toHaveBeenLastCalledWith(
    expect.objectContaining({ interval: 'monthly' })
  );
});

test('default payment completes on success and handles errors', async () => {
  createPayment.mockResolvedValue({ status: 'paid' });
  const args = baseArgs();
  await handleDefaultPayment(args);
  expect(createPayment).toHaveBeenCalled();
  expect(args.completePayment).toHaveBeenCalled();

  createPayment.mockRejectedValue(new Error('fail'));
  const errArgs = baseArgs();
  await handleDefaultPayment(errArgs);
  expect(toast.error).toHaveBeenCalled();
  expect(errArgs.setPaymentStatus).toHaveBeenCalledWith('idle');
});

test('default payment sends installment payload when enabled', async () => {
  createPayment.mockResolvedValue({ status: 'paid' });
  const args = { ...baseArgs(), allowInstallments: true, installments: 2 };
  await handleDefaultPayment(args);
  expect(createPayment).toHaveBeenCalledWith(
    expect.objectContaining({
      amount: 50,
      allow_installments: true,
      installments: 2,
    })
  );
});

test('paypal payment sends installment meta when enabled', async () => {
  initiatePayPalPayment.mockResolvedValue({ approval_url: 'http://paypal' });
  const args = { ...baseArgs(), allowInstallments: true, installments: 2 };
  await handlePayPalPayment(args);
  expect(initiatePayPalPayment).toHaveBeenCalledWith(
    expect.objectContaining({
      amount: 50,
      allow_installments: true,
      installments: 2,
    })
  );
});

test('paypal payment forwards coupon identifiers when present', async () => {
  initiatePayPalPayment.mockResolvedValue({ approval_url: 'http://paypal' });
  const args = { ...baseArgs(), couponId: 'SAVE10' };
  await handlePayPalPayment(args);
  expect(initiatePayPalPayment).toHaveBeenCalledWith(
    expect.objectContaining({ coupon_id: 'SAVE10' })
  );
});

test('bank payment appends installment fields when enabled', async () => {
  initiateBankPayment.mockResolvedValue({ id: 10 });
  const args = {
    ...baseArgs(),
    allowInstallments: true,
    installments: 2,
    formData: {},
  };
  await handleBankPayment(args);
  const formData = initiateBankPayment.mock.calls.pop()[0];
  expect(formData.get('allow_installments')).toBe('true');
  expect(formData.get('installments')).toBe('2');
  expect(formData.get('amount')).toBe('50.00');
});
