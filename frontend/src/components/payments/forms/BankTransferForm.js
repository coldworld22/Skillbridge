import { useState } from 'react';

export default function BankTransferForm({ onSubmit, processing, finalPrice }) {
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [instructions, setInstructions] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          bank_name: bankName,
          account_holder_name: accountHolder,
          account_number: accountNumber,
          swift_code: swiftCode,
          branch_address: branchAddress,
          extra_instructions: instructions,
        });
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="text-sm">Bank Name</span>
        <input
          type="text"
          required
          placeholder="Bank Name"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white"
        />
      </label>
      <label className="block">
        <span className="text-sm">Account Holder Name</span>
        <input
          type="text"
          required
          placeholder="Account Holder Name"
          value={accountHolder}
          onChange={(e) => setAccountHolder(e.target.value)}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white"
        />
      </label>
      <label className="block">
        <span className="text-sm">Account Number / IBAN</span>
        <input
          type="text"
          required
          placeholder="Account Number / IBAN"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white"
        />
      </label>
      <label className="block">
        <span className="text-sm">SWIFT Code</span>
        <input
          type="text"
          required
          placeholder="SWIFT Code"
          value={swiftCode}
          onChange={(e) => setSwiftCode(e.target.value)}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white"
        />
      </label>
      <label className="block">
        <span className="text-sm">Branch Address (optional)</span>
        <input
          type="text"
          placeholder="Branch Address"
          value={branchAddress}
          onChange={(e) => setBranchAddress(e.target.value)}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white"
        />
      </label>
      <label className="block">
        <span className="text-sm">Extra Instructions</span>
        <textarea
          placeholder="Extra Instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
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
    </form>
  );
}
