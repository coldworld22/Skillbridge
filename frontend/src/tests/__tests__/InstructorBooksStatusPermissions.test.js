import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import useAuthStore from '@/store/auth/authStore';
import { updateBookStatus } from '@/services/bookService';
import { fetchInstructorBooks } from '@/services/instructor/bookService';
import { fetchBookCategories } from '@/services/bookCategoryService';
import { getLanguages } from '@/services/languageService';
import { fetchBookTags } from '@/services/bookTagService';

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    replace: jest.fn(),
  }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }) => (
    <a href={typeof href === 'string' ? href : href?.pathname || '#'} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => (opts && opts.defaultValue) || key,
  }),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/components/books/BookCardSkeleton', () => () => (
  <div data-testid="book-card-skeleton" />
));

jest.mock('@/components/common/ConfirmModal', () => ({ isOpen }) => (
  isOpen ? <div data-testid="confirm-modal" /> : null
));

jest.mock('@/services/instructor/bookService', () => ({
  fetchInstructorBooks: jest.fn(),
}));

jest.mock('@/services/bookCategoryService', () => ({
  fetchBookCategories: jest.fn(),
}));

jest.mock('@/services/languageService', () => ({
  getLanguages: jest.fn(),
}));

jest.mock('@/services/bookTagService', () => ({
  fetchBookTags: jest.fn(),
}));

jest.mock('@/services/bookService', () => ({
  __esModule: true,
  deleteBook: jest.fn(),
  updateBookStatus: jest.fn(),
}));

const { InstructorBooksPage } = require('@/pages/dashboard/instructor/books/index');

const initialAuthState = useAuthStore.getState();
const mockBook = {
  id: '1',
  title: 'Test Book',
  status: 'pending',
  instructor_id: '1',
  author: 'Author',
  price: 0,
  tags: [],
};

describe('InstructorBooksPage status permissions', () => {
  beforeAll(() => {
    class MockIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    global.IntersectionObserver = MockIntersectionObserver;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState(initialAuthState, true);
    fetchInstructorBooks.mockResolvedValue({ books: [mockBook], meta: { total: 1, totalPages: 1 } });
    fetchBookCategories.mockResolvedValue([]);
    getLanguages.mockResolvedValue([]);
    fetchBookTags.mockResolvedValue([]);
    updateBookStatus.mockResolvedValue({ ...mockBook, status: 'approved' });
  });

  const renderPage = async () => {
    render(<InstructorBooksPage />);
    await waitFor(() => expect(fetchInstructorBooks).toHaveBeenCalled());
    return await screen.findByTestId('book-status-1');
  };

  it('disables status controls for instructors', async () => {
    useAuthStore.setState({
      user: { id: '1', role: 'instructor', roles: ['instructor'] },
      accessToken: 'token',
      hasHydrated: true,
    });

    const statusSelect = await renderPage();
    expect(statusSelect).toBeDisabled();
    expect(updateBookStatus).not.toHaveBeenCalled();
  });

  it('allows admins to change book status', async () => {
    useAuthStore.setState({
      user: { id: '2', role: 'admin', roles: ['admin'] },
      accessToken: 'token',
      hasHydrated: true,
    });

    const statusSelect = await renderPage();
    expect(statusSelect).not.toBeDisabled();
    expect(statusSelect.value).toBe('pending');

    await act(async () => {
      fireEvent.change(statusSelect, { target: { value: 'approved' } });
    });
    expect(statusSelect.value).toBe('approved');
  });
});
