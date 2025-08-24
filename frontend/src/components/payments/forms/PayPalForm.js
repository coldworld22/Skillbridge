import { useState } from 'react';

export default function PayPalForm({ onSubmit, processing, finalPrice }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, email });
      }}
      className="bg-gray-900 p-4 rounded text-sm text-gray-300 space-y-4"
    >
      <p><strong>PayPal Payment</strong></p>
      <label className="block">
        <span className="text-gray-400">Full Name</span>
        <input
          type="text"
          required
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mt-1 p-2 rounded bg-gray-700 text-white"
        />
      </label>
      <label className="block">
        <span className="text-gray-400">PayPal Email</span>
        <input
          type="email"
          required
          placeholder="PayPal Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-1 p-2 rounded bg-gray-700 text-white"
        />
      </label>
        <p className="text-xs text-gray-400">You&apos;ll be redirected to PayPal to complete this payment.</p>
      <button
        type="submit"
        disabled={processing}
        className="bg-yellow-500 text-black px-4 py-2 rounded font-bold w-full"
      >
        {processing ? 'Processing...' : `Pay $${finalPrice} with PayPal`}
      </button>
    </form>
  );
}
