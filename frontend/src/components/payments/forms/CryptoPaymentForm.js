import { useTranslation } from 'next-i18next';

export default function CryptoPaymentForm({ onSubmit, processing, finalPrice }) {
  const { t } = useTranslation('common');
  const tr = (key, def, opts) => {
    const res = t(key, opts);
    return res === key ? def : res;
  };
  return (
    <div className="bg-gray-900 p-4 rounded text-sm text-gray-300 space-y-4">
      <p>
        <strong>{tr('crypto_payment', 'Crypto Payment')}</strong>
      </p>
      <p className="text-xs text-gray-400">
        {tr('crypto_redirect_notice', "You'll be redirected to our crypto provider to complete this payment.")}
      </p>
      <button
        type="button"
        onClick={() => onSubmit()}
        disabled={processing}
        className="bg-yellow-500 text-black px-4 py-2 rounded font-bold w-full"
      >
        {processing
          ? tr('processing', 'Processing...')
          : tr('pay_with_crypto', `Pay $${finalPrice} with Crypto`, { price: finalPrice })}
      </button>
    </div>
  );
}
