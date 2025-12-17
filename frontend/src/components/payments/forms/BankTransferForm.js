import { useForm } from 'react-hook-form';
import { useTranslation } from 'next-i18next';

export default function BankTransferForm({ onSubmit, processing, finalPrice, bankDetails = {} }) {
  const { t } = useTranslation('common');
  const { register, handleSubmit } = useForm();

  const renderReadonlyField = (label, value, testId) => {
    if (!value) return null;
    return (
      <label className="block">
        <span className="text-sm">{label}</span>
        <input
          type="text"
          readOnly
          value={value}
          data-testid={testId}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white mb-1"
        />
      </label>
    );
  };

  const submit = (data) => {
    onSubmit({
      reference: data.reference || '',
      receipt: data.receipt?.[0] || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      {renderReadonlyField(t('bank_name'), bankDetails.bank_name, 'bank-name')}
      {renderReadonlyField(
        t('account_holder_name'),
        bankDetails.account_holder_name,
        'bank-account-holder'
      )}
      {renderReadonlyField(
        t('bank_account_number'),
        bankDetails.account_number,
        'bank-account-number'
      )}
      {renderReadonlyField(t('bank_iban'), bankDetails.iban, 'bank-iban')}
      {renderReadonlyField(t('swift_code'), bankDetails.swift_code, 'bank-swift')}
      {renderReadonlyField(t('branch_address'), bankDetails.branch_address, 'bank-branch')}
      <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-100 text-sm rounded p-3">
        {bankDetails.instructions || t('bank_additional_instructions')}
      </div>
      <label className="block">
        <span className="text-sm">{t('payment_reference_optional')}</span>
        <input
          type="text"
          placeholder={t('payment_reference_optional')}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white mb-1"
          {...register('reference')}
        />
      </label>
      <label className="block">
        <span className="text-sm">{t('payment_receipt_optional')}</span>
        <input
          type="file"
          className="w-full p-3 text-sm rounded bg-gray-700 text-white"
          {...register('receipt')}
        />
      </label>
      <button
        type="submit"
        disabled={processing}
        className="w-full py-3 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-600 transition-all"
      >
        {processing
          ? 'Processing...'
          : t('pay_with_bank', { price: Number(finalPrice || 0).toFixed(2) })}
      </button>
    </form>
  );
}
