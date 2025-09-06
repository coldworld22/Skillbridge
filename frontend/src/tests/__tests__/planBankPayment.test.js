import { render, screen, waitFor } from '@testing-library/react';
import CheckoutPage from '../../pages/payments/checkout';
import { fetchPlanDetails } from '../../services/public/planService';
import { fetchPaymentMethods } from '../../services/paymentMethodService';

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { itemId: '1', itemType: 'plan' },
    isReady: true,
    push: jest.fn(),
  }),
}));

jest.mock('../../services/public/planService', () => ({ fetchPlanDetails: jest.fn() }));
jest.mock('../../services/paymentMethodService', () => ({ fetchPaymentMethods: jest.fn() }));
jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));
jest.mock('../../components/website/sections/Navbar', () => () => <div />);
jest.mock('../../components/website/sections/Footer', () => () => <div />);

test('shows bank transfer option for plan checkout', async () => {
  fetchPlanDetails.mockResolvedValue({
    data: { id: 1, name: 'Plan', price_monthly: 50, price_yearly: 500 },
  });
  fetchPaymentMethods.mockResolvedValue([
    { id: 1, name: 'Stripe', type: 'stripe' },
    { id: 2, name: 'Bank', type: 'bank' },
  ]);

  render(<CheckoutPage />);
  await screen.findByText(/checkout/i);
  await waitFor(() => expect(fetchPaymentMethods).toHaveBeenCalled());
  expect(screen.getByText('Bank')).toBeInTheDocument();
});

