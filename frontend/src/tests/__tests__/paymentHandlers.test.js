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
} from '../../services/paymentService';
import { createPayment } from '../../services/student/paymentService';
import { toast } from 'react-toastify';

jest.mock('../../services/paymentService', () => ({
  initiateBankPayment: jest.fn(),
  initiatePayPalPayment: jest.fn(),
  initiateCryptoPayment: jest.fn(),
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

test('bank payment redirects on success and handles errors', async () => {
  initiateBankPayment.mockResolvedValue({ id: 55 });
  const args = baseArgs();
  await handleBankPayment(args);
  expect(initiateBankPayment).toHaveBeenCalled();
  expect(args.router.push).toHaveBeenCalledWith(
    '/payments/success?itemType=class&itemId=1&payment_id=55'
  );

  initiateBankPayment.mockRejectedValue(new Error('fail'));
  const errArgs = baseArgs();
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

