import { render, screen, fireEvent } from '@testing-library/react';
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      const translations = {
        pay_with_bank: `Pay $${params?.price} with Bank`,
        bank_name: 'Bank Name',
        account_holder_name: 'Account Holder Name',
        account_number_iban: 'Account Number / IBAN',
        swift_code: 'SWIFT Code',
        branch_address: 'Branch Address',
        payment_reference_optional: 'Reference / Notes (optional)',
        payment_receipt_optional: 'Payment Receipt (optional)',
      };
      return translations[key] || key;
    },
  }),
}));
import BankTransferForm from '@/components/payments/forms/BankTransferForm';

describe('BankTransferForm', () => {
  it('renders bank details read-only and submits reference', () => {
    const handleSubmit = jest.fn();
    const bank = {
      bank_name: 'Test Bank',
      account_holder_name: 'John Holder',
      account_number: '123456',
      swift_code: 'ABCDEF',
    };
    render(
      <BankTransferForm
        onSubmit={handleSubmit}
        processing={false}
        finalPrice={100}
        bankDetails={bank}
      />
    );
    const bankInput = screen.getByDisplayValue('Test Bank');
    expect(bankInput).toHaveAttribute('readonly');
    fireEvent.change(screen.getByPlaceholderText(/Reference/), {
      target: { value: 'My Ref' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /Pay \$100 with Bank/i }).closest('form'));
  });
});
