function CryptoSettings({ config, onChange }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Crypto Wallet Settings</h2>
      <label className="block">
        <span className="text-sm font-medium">Wallet Address</span>
        <input type="text" className="w-full border rounded px-3 py-2" value={config.wallet || ''} onChange={(e) => onChange('wallet', e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Network</span>
        <input type="text" className="w-full border rounded px-3 py-2" value={config.network || ''} onChange={(e) => onChange('network', e.target.value)} />
      </label>
    </div>
  );
}