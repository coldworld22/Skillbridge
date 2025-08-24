export default function PayPalForm({ onSubmit, processing, finalPrice }) {
  return (
    <div className="bg-gray-900 p-4 rounded text-sm text-gray-300 space-y-4">
      <p>
        <strong>PayPal Payment</strong>
      </p>
      <p className="text-xs text-gray-400">
        You&apos;ll be redirected to PayPal to complete this payment.
      </p>
      <button
        type="button"
        onClick={() => onSubmit()}
        disabled={processing}
        className="bg-yellow-500 text-black px-4 py-2 rounded font-bold w-full"
      >
        {processing ? 'Processing...' : `Pay $${finalPrice} with PayPal`}
      </button>
    </div>
  );
}
