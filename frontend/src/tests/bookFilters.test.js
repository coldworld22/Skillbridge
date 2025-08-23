import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BooksPage from '@/pages/marketplace/books';

jest.mock('../services/bookService', () => ({
  fetchBooks: jest.fn(() => Promise.resolve({ books: [] }))
}));

// Mock sidebar to control filter changes
jest.mock('../components/books/FilterSidebar', () => {
  function MockFilterSidebar({ onFilterChange }) {
    return (
      <div>
        <button onClick={() => onFilterChange({ category: 'cat1' })}>set-category</button>
        <button onClick={() => onFilterChange({ category: '', priceRange: 30 })}>set-price</button>
      </div>
    );
  }
  MockFilterSidebar.displayName = 'FilterSidebar';
  return MockFilterSidebar;
});

jest.mock('../components/website/sections/Navbar', () => {
  function MockNavbar() {
    return <div />;
  }
  MockNavbar.displayName = 'Navbar';
  return MockNavbar;
});
jest.mock('../components/website/sections/Footer', () => {
  function MockFooter() {
    return <div />;
  }
  MockFooter.displayName = 'Footer';
  return MockFooter;
});
jest.mock('../components/books/BookCard', () => {
  function MockBookCard() {
    return <div />;
  }
  MockBookCard.displayName = 'BookCard';
  return MockBookCard;
});

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));

beforeAll(() => {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.IntersectionObserver = IO;
});

describe('BooksPage filters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends category and priceRange keys when filters applied', async () => {
    const { fetchBooks } = require('../services/bookService');
    fetchBooks.mockResolvedValue({ books: [] });

    render(<BooksPage />);

    await waitFor(() => expect(fetchBooks).toHaveBeenCalled());
    fetchBooks.mockClear();

    fireEvent.click(screen.getByText('set-category'));
    await waitFor(() => expect(fetchBooks).toHaveBeenCalled());
    let args = fetchBooks.mock.calls[0][0];
    expect(args.filters).toHaveProperty('category', 'cat1');
    expect(args.filters).toHaveProperty('priceRange');

    fetchBooks.mockClear();

    fireEvent.click(screen.getByText('set-price'));
    await waitFor(() => expect(fetchBooks).toHaveBeenCalled());
    args = fetchBooks.mock.calls[0][0];
    expect(args.filters).toHaveProperty('priceRange', 30);
  });
});
