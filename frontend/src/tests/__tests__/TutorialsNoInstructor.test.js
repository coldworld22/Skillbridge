import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TutorialsSection from '@/pages/tutorials/index';
import useAuthStore from '@/store/auth/authStore';
import * as tutorialService from '../../services/tutorialService';

jest.mock('next/image', () => (props) => <img {...props} />);
jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('next-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}));
jest.mock('../../components/website/sections/Navbar', () => () => <div />);
jest.mock('../../components/website/sections/Footer', () => () => <div />);
jest.mock('../../components/tutorials/FilterSidebar', () => () => <div />);

const addItem = jest.fn();
jest.mock('../../store/cart/cartStore', () => ({
  __esModule: true,
  default: (selector) => selector({ addItem }),
}));

jest.mock('../../services/tutorialService', () => ({
  fetchPublishedTutorials: jest.fn(),
  fetchTutorialProgress: jest.fn(),
}));

beforeAll(() => {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.IntersectionObserver = IO;
});

beforeEach(() => {
  useAuthStore.setState({ user: null });
  jest.clearAllMocks();
});

test('handles tutorials without instructor in search', async () => {
  tutorialService.fetchPublishedTutorials.mockResolvedValue([
    { id: 1, title: 'Tutorless', category_name: '', level: '', price: null },
  ]);
  tutorialService.fetchTutorialProgress.mockResolvedValue(null);

  render(<TutorialsSection />);
  const input = await screen.findByPlaceholderText('search_placeholder');
  fireEvent.change(input, { target: { value: 'Tutor' } });
  expect(await screen.findByText('Tutorless')).toBeInTheDocument();
});
