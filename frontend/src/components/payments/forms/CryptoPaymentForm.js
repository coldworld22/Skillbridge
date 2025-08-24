import { useState } from 'react';

export default function CryptoPaymentForm({ onSubmit, processing, finalPrice }) {
  const [email, setEmail] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ email });
      }}
      className="bg-gray-900 p-4 rounded text-sm text-gray-300 space-y-4"
    >
      <p><strong>Crypto Payment</strong></p>
      <p className="text-xs text-gray-400">You&apos;ll be redirected to our crypto provider to complete this payment.</p>
      <label className="block">
        <span className="text-gray-400">Email Address</span>
        <input
          type="email"
          required
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-1 p-2 rounded bg-gray-700 text-white"
        />
      </label>
      <button
        type="submit"
        disabled={processing}
        className="bg-yellow-500 text-black px-4 py-2 rounded font-bold w-full"
      >
        {processing ? 'Processing...' : `Pay $${finalPrice} with Crypto`}
      </button>
    </form>
  );
}
