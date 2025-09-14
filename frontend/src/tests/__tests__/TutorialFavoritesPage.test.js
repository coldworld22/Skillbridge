import { render, screen } from '@testing-library/react';

jest.mock('../../services/tutorialService', () => ({
  getMyTutorialFavorites: jest.fn(),
  removeTutorialFromFavorites: jest.fn(),
}));

jest.mock('../../components/layouts/StudentLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="student-layout">{children}</div>,
}));

import TutorialFavoritesPage from '@/pages/dashboard/student/tutorials/favorites';

const { getMyTutorialFavorites } = require('../../services/tutorialService');

describe('TutorialFavoritesPage', () => {
  test('renders favorites on success', async () => {
    getMyTutorialFavorites.mockResolvedValueOnce([
      { id: 1, title: 'First Tutorial' },
      { id: 2, title: 'Second Tutorial' },
    ]);

    render(<TutorialFavoritesPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading favorites...');

    const first = await screen.findByText('First Tutorial');
    const layout = screen.getByTestId('student-layout');
    expect(layout).toContainElement(first);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('renders error message on failure', async () => {
    getMyTutorialFavorites.mockRejectedValueOnce(new Error('fail'));

    render(<TutorialFavoritesPage />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Failed to load favorite tutorials');
    const layout = screen.getByTestId('student-layout');
    expect(layout).toContainElement(alert);
  });
});
