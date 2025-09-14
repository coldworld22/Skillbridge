import { render, screen } from '@testing-library/react';

jest.mock('next/router', () => ({
  useRouter: () => ({ query: { id: '1' }, back: jest.fn(), push: jest.fn() }),
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('../../components/website/sections/Navbar', () => () => <div />);
jest.mock('../../components/website/sections/Footer', () => () => <div />);
jest.mock('../../components/shared/CustomVideoPlayer', () => () => <div />);
jest.mock('../../components/online-classes/detail/ClassReviews', () => () => <div />);
jest.mock('../../components/online-classes/detail/ClassComments', () => () => <div />);

const addItemMock = jest.fn();
jest.mock('../../store/cart/cartStore', () => ({
  __esModule: true,
  default: (selector) => selector({ addItem: addItemMock }),
}));

jest.mock('react-toastify', () => ({
  toast: { info: jest.fn(), error: jest.fn(), success: jest.fn() },
}));

jest.mock('../../store/auth/authStore', () => ({
  __esModule: true,
  default: () => ({ user: null, isAuthenticated: () => false }),
}));

const mockFetchDetails = jest.fn();
const mockFetchReviews = jest.fn();
jest.mock('../../services/classService', () => ({
  enrollInClass: jest.fn(),
  fetchClassDetails: (...args) => mockFetchDetails(...args),
  fetchMyEnrolledClasses: jest.fn(),
  addClassToWishlist: jest.fn(),
  removeClassFromWishlist: jest.fn(),
  getMyClassWishlist: jest.fn(),
  fetchClassReviews: (...args) => mockFetchReviews(...args),
}));

import ClassDetailsPage from '@/pages/online-classes/[id]';

test('sanitizes class description before rendering', async () => {
  const dirty = '<p>Safe</p><img src=x onerror="alert(1)" /><script>alert(1)</script>';
  mockFetchDetails.mockResolvedValue({
    data: {
      id: 1,
      title: 'Class',
      description: dirty,
      cover_image: '',
      instructor_image: '',
      instructor: '',
      instructor_id: 1,
      price: 0,
      demo_video_url: '',
      start_date: null,
      end_date: null,
      spots_left: 5,
    },
  });
  mockFetchReviews.mockResolvedValue([]);

  render(<ClassDetailsPage />);
  const paragraph = await screen.findByText('Safe');
  expect(paragraph.innerHTML).toBe('Safe');
  expect(paragraph.innerHTML).not.toContain('<script>');
  expect(paragraph.innerHTML).not.toContain('onerror');
});
