import { render, screen } from '@testing-library/react';
import BookCard from '@/components/books/BookCard';
import useAppConfigStore from '@/store/appConfigStore';

const mockI18n = { language: 'en-US' };
jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: mockI18n }),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
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

  it('uses fallback cover and lazy loads image', () => {
    const book = { id: 1, title: 'Fallback Book', price: 5 };
    render(<BookCard book={book} />);
    const img = screen.getByAltText('Fallback Book');
    expect(img).toHaveAttribute('src', '/images/default-book-cover.jpg');
    expect(img).toHaveAttribute('loading', 'lazy');
  });
});
