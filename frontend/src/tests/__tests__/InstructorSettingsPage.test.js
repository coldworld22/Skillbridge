import { render, screen } from '@testing-library/react';
import InstructorSettingsPage from '../../pages/dashboard/instructor/settings';
import useSubscriptionStore from '../../store/subscriptionStore';
import { fetchMySubscription } from '../../services/instructor/subscriptionService';
import api from '../../services/api/api';

jest.mock('../../components/layouts/InstructorLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../services/subscriptionService', () => ({
  fetchMySubscription: jest.fn(),
}));

jest.mock('../../services/api/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

beforeEach(() => {
  useSubscriptionStore.getState().clear();
  window.localStorage.clear();
  api.get.mockResolvedValue({ data: { data: [] } });
});

test('shows active subscription details', async () => {
  fetchMySubscription.mockResolvedValue({
    name: 'Pro Plan',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
  });

  render(<InstructorSettingsPage />);

  const planName = await screen.findByText('Pro Plan');
  expect(planName).toBeInTheDocument();
  const start = screen.getByText(/Start:/).parentElement;
  expect(start).toHaveTextContent(
    new Date('2025-01-01').toLocaleDateString()
  );
  const end = screen.getByText(/End:/).parentElement;
  expect(end).toHaveTextContent(
    new Date('2025-12-31').toLocaleDateString()
  );
});
