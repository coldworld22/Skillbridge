import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TutorialsSection from '@/pages/tutorials/index';
import useAuthStore from '@/store/auth/authStore';
import * as tutorialService from '../../services/tutorialService';

jest.mock('next/image', () => {
  function NextImage(props) {
    return <img {...props} />;
  }
  NextImage.displayName = 'NextImage';
  return NextImage;
});
jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('next-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock('framer-motion', () => {
  const motion = {
    div: function MotionDiv({ children, ...props }) {
      return <div {...props}>{children}</div>;
    },
    h2: function MotionH2({ children, ...props }) {
      return <h2 {...props}>{children}</h2>;
    },
    button: function MotionButton({ children, ...props }) {
      return <button {...props}>{children}</button>;
    },
  };
  motion.div.displayName = 'motion.div';
  motion.h2.displayName = 'motion.h2';
  motion.button.displayName = 'motion.button';
  return { motion };
});
jest.mock('../../components/website/sections/Navbar', () => {
  function MockNavbar() {
    return <div />;
  }
  MockNavbar.displayName = 'Navbar';
  return MockNavbar;
});
jest.mock('../../components/website/sections/Footer', () => {
  function MockFooter() {
    return <div />;
  }
  MockFooter.displayName = 'Footer';
  return MockFooter;
});
jest.mock('../../components/tutorials/FilterSidebar', () => {
  function MockFilterSidebar() {
    return <div />;
  }
  MockFilterSidebar.displayName = 'FilterSidebar';
  return MockFilterSidebar;
});

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
