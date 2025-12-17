import { render, screen, fireEvent } from '@testing-library/react';
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      const translations = {
        pay_with_bank: `Pay $${params?.price} with Bank`,
        bank_name: 'Bank Name',
        account_holder_name: 'Account Holder Name',
        bank_account_number: 'Account Number',
        bank_iban: 'IBAN',
        swift_code: 'SWIFT Code',
        branch_address: 'Branch Address',
        payment_reference_optional: 'Reference / Notes (optional)',
        payment_receipt_optional: 'Payment Receipt (optional)',
        bank_additional_instructions: 'Upload receipt after transfer',
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
      iban: 'DE89370400440532013000',
      swift_code: 'ABCDEF',
      branch_address: 'Main Branch',
      instructions: 'Transfer ASAP',
    };
    render(
      <BankTransferForm
        onSubmit={handleSubmit}
        processing={false}
        finalPrice={100}
        bankDetails={bank}
      />
    );
    expect(screen.getByTestId('bank-name')).toHaveAttribute('readonly');
    expect(screen.getByTestId('bank-account-holder')).toHaveValue('John Holder');
    expect(screen.getByTestId('bank-account-number')).toHaveValue('123456');
    expect(screen.getByTestId('bank-iban')).toHaveValue('DE89370400440532013000');
    expect(screen.getByText('Transfer ASAP')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Reference/), {
      target: { value: 'My Ref' },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: /Pay \$100\.00 with Bank/i }).closest('form')
    );
  });
});
