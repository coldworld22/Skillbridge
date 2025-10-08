import { render, screen } from '@testing-library/react';

jest.mock('../../services/tutorialService', () => ({
  fetchPublishedTutorials: jest.fn(() => Promise.reject(new Error('fail'))),
}));

jest.mock('../../components/layouts/StudentLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="student-layout">{children}</div>,
}));

import StudentTutorialsPage from '@/pages/dashboard/student/tutorials';

test('renders layout during error state', async () => {
  render(<StudentTutorialsPage />);
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Failed to load tutorials');
  const layout = screen.getByTestId('student-layout');
  expect(layout).toBeInTheDocument();
  expect(layout).toContainElement(alert);
});
