import { useTranslation } from 'next-i18next';

export default function PayPalForm({ onSubmit, processing, finalPrice }) {
  const { t } = useTranslation('common');
  return (
    <div className="bg-gray-900 p-4 rounded text-sm text-gray-300 space-y-4">
      <p>
        <strong>{t('paypal_payment')}</strong>
      </p>
      <p className="text-xs text-gray-400">
        {t('paypal_redirect_notice')}
      </p>
      <button
        type="button"
        onClick={() => onSubmit()}
        disabled={processing}
        className="bg-yellow-500 text-black px-4 py-2 rounded font-bold w-full"
      >
        {processing ? 'Processing...' : t('pay_with_paypal', { price: finalPrice })}
      </button>
    </div>
  );
}
