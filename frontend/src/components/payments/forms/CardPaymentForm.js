import { useState } from 'react';

export default function CardPaymentForm({ onSubmit, processing, allowInstallments, installments, perInstallment, finalPrice, selectedMethodLabel }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const buttonText = processing
    ? 'Processing...'
    : allowInstallments
      ? `Pay $${perInstallment.toFixed(2)} (1/${installments}) with ${selectedMethodLabel}`
      : `Pay $${finalPrice} with ${selectedMethodLabel}`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, email, card, expiry, cvc });
      }}
    >
      <input
        type="text"
        placeholder="Full Name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full mb-3 p-3 text-sm rounded bg-gray-700 text-white"
      />
      <input
        type="email"
        placeholder="Email Address"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-3 p-3 text-sm rounded bg-gray-700 text-white"
      />
      <input
        type="tel"
        placeholder="Card Number"
        required
        inputMode="numeric"
        value={card}
        onChange={(e) => setCard(e.target.value)}
        className="w-full mb-3 p-3 text-sm rounded bg-gray-700 text-white"
      />
      <input
        type="text"
        placeholder="Expiration Date (MM/YY)"
        required
        value={expiry}
        onChange={(e) => setExpiry(e.target.value)}
        className="w-full mb-3 p-3 text-sm rounded bg-gray-700 text-white"
      />
      <input
        type="text"
        placeholder="CVC"
        required
        value={cvc}
        onChange={(e) => setCvc(e.target.value)}
        className="w-full mb-6 p-3 text-sm rounded bg-gray-700 text-white"
      />
      <button
        type="submit"
        disabled={processing}
        className="w-full py-3 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-600 transition-all"
      >
        {buttonText}
      </button>
      <p className="text-sm text-gray-500 mt-2 text-center">You&apos;ll be redirected after successful payment.</p>
    </form>
  );
}
