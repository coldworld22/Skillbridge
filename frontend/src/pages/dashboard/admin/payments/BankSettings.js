function BankSettings({ config, onChange }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Bank Transfer Settings</h2>
      <label className="block">
        <span className="text-sm font-medium">Bank Name</span>
        <input type="text" className="w-full border rounded px-3 py-2" value={config.bankName || ''} onChange={(e) => onChange('bankName', e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">IBAN</span>
        <input type="text" className="w-full border rounded px-3 py-2" value={config.iban || ''} onChange={(e) => onChange('iban', e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">SWIFT Code</span>
        <input type="text" className="w-full border rounded px-3 py-2" value={config.swift || ''} onChange={(e) => onChange('swift', e.target.value)} />
      </label>
    </div>
  );
}