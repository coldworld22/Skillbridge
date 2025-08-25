import { useState } from 'react';
import { useTranslation } from 'next-i18next';

export default function BankTransferForm({ onSubmit, processing, finalPrice }) {
  const { t } = useTranslation('common');
  const tr = (key, def, opts) => {
    const res = t(key, opts);
    return res === key ? def : res;
  };
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
        <span className="text-sm">{tr('bank_name_label', 'Bank Name')}</span>
        <input
          type="text"
          required
          placeholder={tr('bank_name_placeholder', 'Bank Name')}
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white"
        />
      </label>
      <label className="block">
        <span className="text-sm">{tr('account_holder_label', 'Account Holder Name')}</span>
        <input
          type="text"
          required
          placeholder={tr('account_holder_placeholder', 'Account Holder Name')}
          value={accountHolder}
          onChange={(e) => setAccountHolder(e.target.value)}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white"
        />
      </label>
      <label className="block">
        <span className="text-sm">{tr('account_number_label', 'Account Number / IBAN')}</span>
        <input
          type="text"
          required
          placeholder={tr('account_number_placeholder', 'Account Number / IBAN')}
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white"
        />
      </label>
      <label className="block">
        <span className="text-sm">{tr('swift_code_label', 'SWIFT Code')}</span>
        <input
          type="text"
          required
          placeholder={tr('swift_code_placeholder', 'SWIFT Code')}
          value={swiftCode}
          onChange={(e) => setSwiftCode(e.target.value)}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white"
        />
      </label>
      <label className="block">
        <span className="text-sm">{tr('branch_address_label', 'Branch Address (optional)')}</span>
        <input
          type="text"
          placeholder={tr('branch_address_placeholder', 'Branch Address')}
          value={branchAddress}
          onChange={(e) => setBranchAddress(e.target.value)}
          className="w-full p-3 text-sm rounded bg-gray-700 text-white"
        />
      </label>
      <label className="block">
        <span className="text-sm">{tr('instructions_label', 'Extra Instructions')}</span>
        <textarea
          placeholder={tr('instructions_placeholder', 'Extra Instructions')}
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
        {processing
          ? tr('processing', 'Processing...')
          : tr('pay_with_bank', `Pay $${finalPrice} with Bank`, { price: finalPrice })}
      </button>
    </form>
  );
}
