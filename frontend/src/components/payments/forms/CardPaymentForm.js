import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useForm } from 'react-hook-form';

export default function CardPaymentForm({
  onSubmit,
  processing,
  allowInstallments,
  installments,
  perInstallment,
  finalPrice,
  selectedMethodLabel,
  requireStripeTokenization = true,
}) {
  const [error, setError] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const stripe = useStripe();
  const elements = useElements();
  const usingInstallments = allowInstallments && installments > 1;
  const buttonText = processing
    ? 'Processing...'
    : usingInstallments
      ? `Pay $${perInstallment.toFixed(2)} (1/${installments}) with ${selectedMethodLabel}`
      : `Pay $${finalPrice} with ${selectedMethodLabel}`;

  const submit = async (data) => {
    setError(null);

    if (!requireStripeTokenization) {
      onSubmit(data);
      return;
    }

    if (!stripe || !elements) {
      setError('Payment service unavailable. Please try again later.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    const { error: stripeError, token } = await stripe.createToken(cardElement);
    if (stripeError) {
      setError(stripeError.message);
      return;
    }
    onSubmit({ ...data, token: token.id });
  };

  return (
    <form onSubmit={handleSubmit(submit)}>
      <input
        type="text"
        placeholder="Full Name"
        className="w-full mb-1 p-3 text-sm rounded bg-gray-700 text-white"
        {...register('name', { required: 'Full name is required' })}
      />
      {errors.name && (
        <p className="text-red-500 text-sm mb-2">{errors.name.message}</p>
      )}
      <input
        type="email"
        placeholder="Email Address"
        className="w-full mb-1 p-3 text-sm rounded bg-gray-700 text-white"
        {...register('email', { required: 'Email is required' })}
      />
      <div className="w-full mb-6 p-3 text-sm rounded bg-gray-700 text-white">
        <CardElement options={{ style: { base: { color: '#fff' } } }} />
      </div>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <button
        type="submit"
        disabled={processing || (requireStripeTokenization && !stripe)}
        className="w-full py-3 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-600 transition-all"
      >
        {buttonText}
      </button>
      <p className="text-sm text-gray-500 mt-2 text-center">You&apos;ll be redirected after successful payment.</p>
    </form>
  );
}
