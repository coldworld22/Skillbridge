import { render, screen } from '@testing-library/react';
import BookCard from '@/components/books/BookCard';

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
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
  it('formats price to two decimal places', () => {
    const book = { id: 1, title: 'Test Book', price: 10 };
    render(<BookCard book={book} />);
    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });
});
