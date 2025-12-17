import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TutorialCard from '@/components/tutorials/TutorialCard';

const addItem = jest.fn();
jest.mock('../../store/cart/cartStore', () => ({
  __esModule: true,
  default: (selector) => selector({ addItem }),
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe('TutorialCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds tutorial to cart with quantity and shows success toast', async () => {
    addItem.mockResolvedValue(true);
    const tutorial = { id: 1, title: 'Test Tutorial', price: 10 };
    render(<TutorialCard tutorial={tutorial} />);
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    await waitFor(() => expect(addItem).toHaveBeenCalled());
    expect(addItem).toHaveBeenCalledWith({
      id: 1,
      name: 'Test Tutorial',
      price: 10,
      item_type: 'tutorial',
      quantity: 1,
    });
    const { toast } = require('react-toastify');
    expect(toast.success).toHaveBeenCalledWith('Added to cart');
  });

  it('uses discount price when available', async () => {
    addItem.mockResolvedValue(true);
    const tutorial = {
      id: 3,
      title: 'Discount Tutorial',
      price: 20,
      discountPrice: 15,
    };
    render(<TutorialCard tutorial={tutorial} />);
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    await waitFor(() => expect(addItem).toHaveBeenCalled());
    expect(addItem).toHaveBeenCalledWith({
      id: 3,
      name: 'Discount Tutorial',
      price: 15,
      item_type: 'tutorial',
      quantity: 1,
    });
  });

  it('shows error toast when addItem fails', async () => {
    addItem.mockResolvedValue(false);
    const tutorial = { id: 2, title: 'Another Tutorial', price: 5 };
    render(<TutorialCard tutorial={tutorial} />);
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    await waitFor(() => expect(addItem).toHaveBeenCalled());
    const { toast } = require('react-toastify');
    expect(toast.error).toHaveBeenCalledWith('Failed to add to cart');
  });
});
