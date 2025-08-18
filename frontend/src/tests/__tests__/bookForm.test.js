import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookForm from '@/components/books/BookForm';

jest.mock('../../services/languageService', () => ({
  getLanguages: jest.fn(),
}));

jest.mock('../../services/bookTagService', () => ({
  fetchBookTags: jest.fn(),
  createBookTag: jest.fn(),
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('react-hot-toast', () => ({
  toast: { error: jest.fn() },
}));

describe('BookForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows error toast when language fetch fails', async () => {
    const { getLanguages } = require('../../services/languageService');
    getLanguages.mockRejectedValue(new Error('fail'));

    render(<BookForm onSubmit={jest.fn()} categories={[]} />);

    const { toast } = require('react-hot-toast');
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load languages'));
  });

  it('shows error toast when tag fetch fails', async () => {
    const { getLanguages } = require('../../services/languageService');
    getLanguages.mockResolvedValue([]);
    const { fetchBookTags } = require('../../services/bookTagService');
    fetchBookTags.mockRejectedValue(new Error('fail'));

    render(<BookForm onSubmit={jest.fn()} categories={[]} />);

    const input = screen.getByPlaceholderText('booksCreate.addTagsPlaceholder');
    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => expect(fetchBookTags).toHaveBeenCalled());
    const { toast } = require('react-hot-toast');
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to fetch tags'));
  });
});
