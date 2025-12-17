import { render, screen } from '@testing-library/react';

jest.mock('../../services/tutorialService', () => ({
  getMyEnrolledTutorials: jest.fn(() => Promise.reject(new Error('fail'))),
  fetchTutorialProgress: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/dashboard/student/tutorials',
    query: {},
  }),
}));

jest.mock('../../components/layouts/StudentLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="student-layout">{children}</div>,
}));

import StudentTutorialsPage from '@/pages/dashboard/student/tutorials';
import useAuthStore from '@/store/auth/authStore';

const futureExp = Math.floor(Date.now() / 1000) + 3600;
const mockToken = `header.${Buffer.from(
  JSON.stringify({ exp: futureExp })
).toString('base64')}.signature`;

beforeEach(() => {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      role: 'student',
      profile_complete: true,
      is_email_verified: true,
      permissions: [],
    },
    accessToken: mockToken,
    hasHydrated: true,
  });
});

test('renders alert during error state', async () => {
  render(<StudentTutorialsPage />);
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Failed to load tutorials');
});
