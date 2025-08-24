import { useState } from 'react';

export default function BankTransferForm({ onSubmit, processing, finalPrice }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, email });
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="text-sm">Account Holder Name</span>
        <input
          type="text"
          required
          placeholder="Account Holder Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white"
        />
      </label>
      <label className="block">
        <span className="text-sm">Email Address</span>
        <input
          type="email"
          required
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white"
        />
      </label>
      <button
        type="submit"
        disabled={processing}
        className="w-full py-3 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-600 transition-all"
      >
        {processing ? 'Processing...' : `Pay $${finalPrice} with Bank`}
      </button>
      <p className="text-sm text-gray-500 text-center">
        Bank transfer instructions will be provided after submission.
      </p>
    </form>
  );
}
