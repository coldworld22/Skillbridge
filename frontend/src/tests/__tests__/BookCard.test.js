import { render, screen } from '@testing-library/react';
import BookCard from '@/components/books/BookCard';
import useAppConfigStore from '@/store/appConfigStore';

const mockI18n = { language: 'en-US' };
jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: mockI18n }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('BookCard', () => {
  beforeEach(() => {
    useAppConfigStore.setState({ settings: { currency: 'USD' } });
    mockI18n.language = 'en-US';
  });

  it('formats price to two decimal places in USD', () => {
    const book = { id: 1, title: 'Test Book', price: 10 };
    render(<BookCard book={book} />);
    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });

  it('formats price based on locale and currency', () => {
    const book = { id: 1, title: 'Test Book', price: 10 };
    useAppConfigStore.setState({ settings: { currency: 'GBP' } });
    mockI18n.language = 'en-GB';
    render(<BookCard book={book} />);
    expect(screen.getByText('£10.00')).toBeInTheDocument();
  });

  it.each([
    ['pending', 'bg-yellow-100', 'text-yellow-800'],
    ['approved', 'bg-green-100', 'text-green-800'],
    ['rejected', 'bg-red-100', 'text-red-800'],
    ['active', 'bg-green-100', 'text-green-800'],
    ['inactive', 'bg-gray-100', 'text-gray-800'],
  ])('renders %s badge with correct classes', (status, bg, text) => {
    const book = { id: 1, title: 'Test Book', price: 10, status };
    render(<BookCard book={book} />);
    const badge = screen.getByText(status);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(bg);
    expect(badge).toHaveClass(text);
  });
});
