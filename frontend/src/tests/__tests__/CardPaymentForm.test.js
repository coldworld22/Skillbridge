import { render, screen, fireEvent } from '@testing-library/react';
import CardPaymentForm from '@/components/payments/forms/CardPaymentForm';

describe('CardPaymentForm validation', () => {
  it('shows error when Stripe returns an error', async () => {
    const handleSubmit = jest.fn();
    global.mockStripeCreateToken.mockResolvedValueOnce({ error: { message: 'Invalid card number' } });
    render(
      <CardPaymentForm
        onSubmit={handleSubmit}
        processing={false}
        allowInstallments={false}
        finalPrice={100}
        selectedMethodLabel="Stripe"
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'john@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: /Pay \$100 with Stripe/i }));

    expect(await screen.findByText('Invalid card number')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
