import { useForm } from 'react-hook-form';

export default function CardPaymentForm({ onSubmit, processing, allowInstallments, installments, perInstallment, finalPrice, selectedMethodLabel }) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const buttonText = processing
    ? 'Processing...'
    : allowInstallments
      ? `Pay $${perInstallment.toFixed(2)} (1/${installments}) with ${selectedMethodLabel}`
      : `Pay $${finalPrice} with ${selectedMethodLabel}`;

  const submit = (data) => {
    onSubmit(data);
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
      {errors.email && (
        <p className="text-red-500 text-sm mb-2">{errors.email.message}</p>
      )}
      <input
        type="tel"
        placeholder="Card Number"
        inputMode="numeric"
        className="w-full mb-1 p-3 text-sm rounded bg-gray-700 text-white"
        {...register('card', {
          required: 'Card number is required',
          pattern: {
            value: /^\d{16}$/,
            message: 'Invalid card number'
          }
        })}
      />
      {errors.card && (
        <p className="text-red-500 text-sm mb-2">{errors.card.message}</p>
      )}
      <input
        type="text"
        placeholder="Expiration Date (MM/YY)"
        className="w-full mb-1 p-3 text-sm rounded bg-gray-700 text-white"
        {...register('expiry', { required: 'Expiration date is required' })}
      />
      {errors.expiry && (
        <p className="text-red-500 text-sm mb-2">{errors.expiry.message}</p>
      )}
      <input
        type="text"
        placeholder="CVC"
        className="w-full mb-6 p-3 text-sm rounded bg-gray-700 text-white"
        {...register('cvc', { required: 'CVC is required' })}
      />
      {errors.cvc && (
        <p className="text-red-500 text-sm mb-2 -mt-5">{errors.cvc.message}</p>
      )}
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
