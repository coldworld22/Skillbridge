import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookDetails from '@/components/books/BookDetails';
import useAppConfigStore from '@/store/appConfigStore';
import useAuthStore from '@/store/auth/authStore';

const mockI18n = { language: 'en-US' };
jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: mockI18n }),
}));

const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockAddItem = jest.fn();
jest.mock('../../store/cart/cartStore', () => ({
  __esModule: true,
  default: (selector) => selector({ addItem: mockAddItem }),
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
    mockI18n.language = 'en-US';
    mockPush.mockReset();
    mockAddItem.mockReset();
    jest.clearAllMocks();
  });

  it('displays rating even when zero', () => {
    const book = { id: 1, title: 'Test', rating: 0, price: 0, pdf_url: null };
    render(<BookDetails book={book} />);
    expect(screen.getByLabelText('0.0 out of 5')).toBeInTheDocument();
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

  it('renders buy now button for paid books without access', () => {
    const book = { id: 1, title: 'Test', price: 10, user_has_access: false };
    render(<BookDetails book={book} />);
    expect(screen.getByRole('button', { name: 'buy_now' })).toBeInTheDocument();
  });

  it('adds book to cart and redirects to checkout when buy now is clicked', async () => {
    const book = {
      id: 42,
      title: 'Checkout Book',
      price: 15,
      user_has_access: false,
    };
    mockAddItem.mockResolvedValue(true);

    render(<BookDetails book={book} />);

    fireEvent.click(screen.getByRole('button', { name: 'buy_now' }));

    await waitFor(() => expect(mockAddItem).toHaveBeenCalled());
    expect(mockPush).toHaveBeenCalledWith('/payments/checkout?itemId=42&itemType=book');
  });
});
