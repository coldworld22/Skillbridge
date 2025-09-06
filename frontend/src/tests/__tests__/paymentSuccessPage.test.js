import { render, waitFor } from '@testing-library/react';
import PaymentSuccessPage from '../../pages/payments/success';
import { enrollInClass, fetchClassDetails } from '../../services/classService';
import { enrollInTutorial, fetchTutorialDetails } from '../../services/tutorialService';
import { fetchMyPayments } from '../../services/student/paymentService';
import { fetchInvoiceByPaymentId } from '../../services/student/invoiceService';

jest.mock('../../components/website/sections/Navbar', () => () => <div />);
jest.mock('../../components/website/sections/Footer', () => () => <div />);

jest.mock('../../services/classService', () => ({
  enrollInClass: jest.fn(),
  fetchClassDetails: jest.fn(),
}));

jest.mock('../../services/tutorialService', () => ({
  enrollInTutorial: jest.fn(),
  fetchTutorialDetails: jest.fn(),
}));

jest.mock('../../services/student/paymentService', () => ({
  fetchMyPayments: jest.fn(),
}));

jest.mock('../../services/student/invoiceService', () => ({
  fetchInvoiceByPaymentId: jest.fn(),
  downloadInvoice: jest.fn(),
}));

jest.mock('../../services/bookService', () => ({ fetchBook: jest.fn() }));
jest.mock('../../services/public/planService', () => ({ fetchPlanDetails: jest.fn() }));
jest.mock('../../services/subscriptionService', () => ({
  subscribeToPlan: jest.fn(),
  fetchMySubscription: jest.fn(),
}));

jest.mock('../../store/libraryStore', () => ({
  __esModule: true,
  default: (selector) => {
    const state = { fetchLibrary: jest.fn() };
    return typeof selector === 'function' ? selector(state) : state;
  },
}));

jest.mock('../../store/cart/cartStore', () => ({
  __esModule: true,
  default: (selector) => selector({ removeItem: jest.fn() }),
}));

jest.mock('react-toastify', () => ({ toast: { error: jest.fn() } }));

const mockUseRouter = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => mockUseRouter() }));

beforeEach(() => {
  jest.clearAllMocks();
});

test('enrolls in class when payment_id is missing', async () => {
  mockUseRouter.mockReturnValue({ query: { itemType: 'class', itemId: '1' } });
  fetchClassDetails.mockResolvedValue({ data: { id: 1, title: 'Class' } });

  render(<PaymentSuccessPage />);
  await waitFor(() => expect(fetchClassDetails).toHaveBeenCalled());
  expect(enrollInClass).toHaveBeenCalledWith('1');
  expect(fetchMyPayments).not.toHaveBeenCalled();
});

test('skips class enrollment when payment_id is present', async () => {
  mockUseRouter.mockReturnValue({ query: { itemType: 'class', itemId: '1', payment_id: '10' } });
  fetchClassDetails.mockResolvedValue({ data: { id: 1, title: 'Class' } });
  fetchMyPayments.mockResolvedValue([{ id: 10 }]);
  fetchInvoiceByPaymentId.mockResolvedValue({ id: 5 });

  render(<PaymentSuccessPage />);
  await waitFor(() => expect(fetchClassDetails).toHaveBeenCalled());
  expect(enrollInClass).not.toHaveBeenCalled();
  expect(fetchMyPayments).toHaveBeenCalled();
});

test('enrolls in tutorial when payment_id is missing', async () => {
  mockUseRouter.mockReturnValue({ query: { itemType: 'tutorial', itemId: '1' } });
  fetchTutorialDetails.mockResolvedValue({ data: { id: 1, title: 'Tut' } });

  render(<PaymentSuccessPage />);
  await waitFor(() => expect(fetchTutorialDetails).toHaveBeenCalled());
  expect(enrollInTutorial).toHaveBeenCalledWith('1');
  expect(fetchMyPayments).not.toHaveBeenCalled();
});

test('skips tutorial enrollment when payment_id is present', async () => {
  mockUseRouter.mockReturnValue({ query: { itemType: 'tutorial', itemId: '1', payment_id: '22' } });
  fetchTutorialDetails.mockResolvedValue({ data: { id: 1, title: 'Tut' } });
  fetchMyPayments.mockResolvedValue([{ id: 22 }]);
  fetchInvoiceByPaymentId.mockResolvedValue({ id: 5 });

  render(<PaymentSuccessPage />);
  await waitFor(() => expect(fetchTutorialDetails).toHaveBeenCalled());
  expect(enrollInTutorial).not.toHaveBeenCalled();
  expect(fetchMyPayments).toHaveBeenCalled();
});
