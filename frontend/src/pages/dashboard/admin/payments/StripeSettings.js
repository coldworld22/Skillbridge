function StripeSettings({ config, onChange }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Stripe Settings</h2>
      <label className="block">
        <span className="text-sm font-medium">Publishable Key</span>
        <input type="text" className="w-full border rounded px-3 py-2" value={config.publicKey || ''} onChange={(e) => onChange('publicKey', e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Secret Key</span>
        <input type="password" className="w-full border rounded px-3 py-2" value={config.secretKey || ''} onChange={(e) => onChange('secretKey', e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Webhook Secret</span>
        <input type="text" className="w-full border rounded px-3 py-2" value={config.webhookSecret || ''} onChange={(e) => onChange('webhookSecret', e.target.value)} />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={config.testMode} onChange={(e) => onChange('testMode', e.target.checked)} />
        <span>Enable Test Mode</span>
      </label>
    </div>
  );
}