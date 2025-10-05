import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
      branch_address: '123 Example St',
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
    expect(screen.getByDisplayValue('123 Example St')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Reference/), {
      target: { value: 'My Ref' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /Pay \$100 with Bank/i }).closest('form'));
    return waitFor(() =>
      expect(handleSubmit).toHaveBeenCalledWith({ reference: 'My Ref', receipt: null })
    );
  });

  it('supports bank settings nested inside the details object', () => {
    const handleSubmit = jest.fn();
    const bank = {
      settings: {
        bank_name: 'Nested Bank',
        account_holder_name: 'Nested Holder',
        account_number: '654321',
        swift_code: 'FEDCBA',
      },
    };
    render(
      <BankTransferForm
        onSubmit={handleSubmit}
        processing={false}
        finalPrice={50}
        bankDetails={bank}
      />
    );
    expect(screen.getByDisplayValue('Nested Bank')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Nested Holder')).toBeInTheDocument();
    expect(screen.getByDisplayValue('654321')).toBeInTheDocument();
    expect(screen.getByDisplayValue('FEDCBA')).toBeInTheDocument();
  });

  it('supports nested bank settings structures', () => {
    const handleSubmit = jest.fn();
    const bank = {
      bank: {
        bank_name: 'Nested Bank',
        account_holder_name: 'Nested Holder',
        account_number: '987654',
        swift_code: 'ZXCVBN',
        branch_address: '456 Nested Ave',
      },
    };
    render(
      <BankTransferForm
        onSubmit={handleSubmit}
        processing={false}
        finalPrice={200}
        bankDetails={bank}
      />
    );
    expect(screen.getByDisplayValue('Nested Bank')).toBeInTheDocument();
    expect(screen.getByDisplayValue('456 Nested Ave')).toBeInTheDocument();
  });
});
