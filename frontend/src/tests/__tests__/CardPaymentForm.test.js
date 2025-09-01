import { render, screen, fireEvent } from '@testing-library/react';
import CardPaymentForm from '@/components/payments/forms/CardPaymentForm';

describe('CardPaymentForm validation', () => {
  it('shows error for invalid card number', async () => {
    const handleSubmit = jest.fn();
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
    fireEvent.change(screen.getByPlaceholderText('Card Number'), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText('Expiration Date (MM/YY)'), { target: { value: '12/30' } });
    fireEvent.change(screen.getByPlaceholderText('CVC'), { target: { value: '123' } });

    fireEvent.click(screen.getByRole('button', { name: /Pay \$100 with Stripe/i }));

    expect(await screen.findByText('Invalid card number')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
