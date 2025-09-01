import { render, screen, fireEvent } from '@testing-library/react';
import BankTransferForm from '@/components/payments/forms/BankTransferForm';

describe('BankTransferForm validation', () => {
  it('shows error when bank name is missing', async () => {
    const handleSubmit = jest.fn();
    render(<BankTransferForm onSubmit={handleSubmit} processing={false} finalPrice={100} />);

    fireEvent.change(screen.getByPlaceholderText('Account Holder Name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('Account Number / IBAN'), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('SWIFT Code'), { target: { value: 'ABCDEF' } });

    fireEvent.click(screen.getByRole('button', { name: /Pay \$100 with Bank/i }));

    expect(await screen.findByText('Bank name is required')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
