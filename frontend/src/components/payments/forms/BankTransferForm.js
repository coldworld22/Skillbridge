import { useForm } from 'react-hook-form';

export default function BankTransferForm({ onSubmit, processing, finalPrice }) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const submit = (data) => {
    onSubmit({
      bank_name: data.bankName,
      account_holder_name: data.accountHolder,
      account_number: data.accountNumber,
      swift_code: data.swiftCode,
      branch_address: data.branchAddress,
      extra_instructions: data.instructions,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <label className="block">
        <span className="text-sm">Bank Name</span>
        <input
          type="text"
          placeholder="Bank Name"
          className="w-full p-3 text-sm rounded bg-gray-700 text-white mb-1"
          {...register('bankName', { required: 'Bank name is required' })}
        />
        {errors.bankName && (
          <p className="text-red-500 text-sm">{errors.bankName.message}</p>
        )}
      </label>
      <label className="block">
        <span className="text-sm">Account Holder Name</span>
        <input
          type="text"
          placeholder="Account Holder Name"
          className="w-full p-3 text-sm rounded bg-gray-700 text-white mb-1"
          {...register('accountHolder', { required: 'Account holder name is required' })}
        />
        {errors.accountHolder && (
          <p className="text-red-500 text-sm">{errors.accountHolder.message}</p>
        )}
      </label>
      <label className="block">
        <span className="text-sm">Account Number / IBAN</span>
        <input
          type="text"
          placeholder="Account Number / IBAN"
          className="w-full p-3 text-sm rounded bg-gray-700 text-white mb-1"
          {...register('accountNumber', { required: 'Account number is required' })}
        />
        {errors.accountNumber && (
          <p className="text-red-500 text-sm">{errors.accountNumber.message}</p>
        )}
      </label>
      <label className="block">
        <span className="text-sm">SWIFT Code</span>
        <input
          type="text"
          placeholder="SWIFT Code"
          className="w-full p-3 text-sm rounded bg-gray-700 text-white mb-1"
          {...register('swiftCode', { required: 'SWIFT code is required' })}
        />
        {errors.swiftCode && (
          <p className="text-red-500 text-sm">{errors.swiftCode.message}</p>
        )}
      </label>
      <label className="block">
        <span className="text-sm">Branch Address (optional)</span>
        <input
          type="text"
          placeholder="Branch Address"
          className="w-full p-3 text-sm rounded bg-gray-700 text-white"
          {...register('branchAddress')}
        />
      </label>
      <label className="block">
        <span className="text-sm">Extra Instructions</span>
        <textarea
          placeholder="Extra Instructions"
          className="w-full p-3 text-sm rounded bg-gray-700 text-white"
          {...register('instructions')}
        />
      </label>
      <button
        type="submit"
        disabled={processing}
        className="w-full py-3 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-600 transition-all"
      >
        {processing ? 'Processing...' : `Pay $${finalPrice} with Bank`}
      </button>
    </form>
  );
}
