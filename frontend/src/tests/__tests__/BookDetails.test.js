import { render, screen } from '@testing-library/react';
import BookDetails from '@/components/books/BookDetails';
import useAppConfigStore from '@/store/appConfigStore';
import useAuthStore from '@/store/auth/authStore';
import useLibraryStore from '@/store/libraryStore';

const mockI18n = { language: 'en-US' };
jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: mockI18n }),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock(
  'react-hot-toast',
  () => ({ toast: { info: jest.fn(), error: jest.fn(), success: jest.fn() } }),
  { virtual: true }
);

describe('BookDetails', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { role: 'student' }, accessToken: 'token' });
    useAppConfigStore.setState({ settings: { currency: 'USD' } });
    useLibraryStore.setState({
      books: [],
      fetchLibrary: jest.fn().mockResolvedValue([]),
    });
    mockI18n.language = 'en-US';
  });

  it('displays rating even when zero', () => {
    const book = { id: 1, title: 'Test', rating: 0, price: 0, pdf_url: null };
    render(<BookDetails book={book} />);
    expect(
      screen.getByText((content) => /0\.0\s*\/\s*5/.test(content))
    ).toBeInTheDocument();
  });

  it('formats price in USD', () => {
    const book = { id: 1, title: 'Test', price: 10, user_has_access: false };
    render(<BookDetails book={book} />);
    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });

  it('formats price based on locale and currency', () => {
    const book = { id: 1, title: 'Test', price: 10, user_has_access: false };
    useAppConfigStore.setState({ settings: { currency: 'GBP' } });
    mockI18n.language = 'en-GB';
    render(<BookDetails book={book} />);
    expect(screen.getByText('£10.00')).toBeInTheDocument();
  });
});
