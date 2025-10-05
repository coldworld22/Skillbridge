import { useForm } from 'react-hook-form';
import { useTranslation } from 'next-i18next';

export default function BankTransferForm({ onSubmit, processing, finalPrice, bankDetails = {} }) {
  const { t } = useTranslation('common');
  const { register, handleSubmit } = useForm();

  const resolvedDetails =
    bankDetails?.bank ||
    bankDetails?.bank_details ||
    bankDetails?.details ||
    bankDetails || {};

  const getDetail = (key) =>
    resolvedDetails?.[key] ?? bankDetails?.[key] ?? '';

  const branchAddress = getDetail('branch_address');

  const submit = (data) => {
    onSubmit({
      reference: data.reference || '',
      receipt: data.receipt?.[0] || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <label className="block">
        <span className="text-sm">{t('bank_name')}</span>
        <input
          type="text"
          readOnly
          value={getDetail('bank_name')}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white mb-1"
        />
      </label>
      <label className="block">
        <span className="text-sm">{t('account_holder_name')}</span>
        <input
          type="text"
          readOnly
          value={getDetail('account_holder_name')}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white mb-1"
        />
      </label>
      <label className="block">
        <span className="text-sm">{t('account_number_iban')}</span>
        <input
          type="text"
          readOnly
          value={getDetail('account_number')}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white mb-1"
        />
      </label>
      <label className="block">
        <span className="text-sm">{t('swift_code')}</span>
        <input
          type="text"
          readOnly
          value={getDetail('swift_code')}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white mb-1"
        />
      </label>
      {branchAddress && (
        <label className="block">
          <span className="text-sm">{t('branch_address')}</span>
          <input
            type="text"
            readOnly
            value={branchAddress}
            className="w-full p-3 text-sm rounded bg-gray-700 text-white mb-1"
          />
        </label>
      )}
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
        {processing ? 'Processing...' : t('pay_with_bank', { price: finalPrice })}
      </button>
    </form>
  );
}

