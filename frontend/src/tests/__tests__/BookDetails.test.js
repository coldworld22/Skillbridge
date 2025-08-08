import { render, screen } from '@testing-library/react';
import BookDetails from '@/components/books/BookDetails';

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../store/cart/cartStore', () => () => ({ addItem: jest.fn() }));
jest.mock('../../store/auth/authStore', () => () => ({ isAuthenticated: () => true, user: { role: 'student' } }));

jest.mock('react-toastify', () => ({ toast: { info: jest.fn(), error: jest.fn(), success: jest.fn() } }));

describe('BookDetails', () => {
  it('displays rating even when zero', () => {
    const book = { id: 1, title: 'Test', rating: 0, is_paid: false, pdf_url: null };
    render(<BookDetails book={book} />);
    expect(screen.getByText('⭐ 0.0 / 5')).toBeInTheDocument();
  });
});
