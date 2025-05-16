// pages/dashboard/admin/payments/index.js
import { useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';

function PayPalSettings({ config, onChange }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">PayPal Settings</h2>
      <label className="block">
        <span className="text-sm font-medium">Client ID</span>
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          value={config.clientId || ''}
          onChange={(e) => onChange('clientId', e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Secret</span>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={config.secret || ''}
          onChange={(e) => onChange('secret', e.target.value)}
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={config.sandbox}
          onChange={(e) => onChange('sandbox', e.target.checked)}
        />
        <span>Enable Sandbox Mode</span>
      </label>
    </div>
  );
}

const tabs = ['General', 'PayPal', 'Stripe', 'Bank Transfer', 'Crypto'];

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState('PayPal');
  const [paypalConfig, setPaypalConfig] = useState({
    clientId: 'mock-client-id',
    secret: 'mock-secret-key',
    sandbox: true,
  });
  const [stripeConfig, setStripeConfig] = useState({
    publicKey: 'pk_test_mock',
    secretKey: 'sk_test_mock',
    webhookSecret: 'whsec_mock',
    testMode: true,
  });
  const [bankConfig, setBankConfig] = useState({
    bankName: 'Mock Bank',
    iban: 'SA03 8000 0000 6080 1016 7519',
    swift: 'MOCKSWIFT',
  });
  const [cryptoConfig, setCryptoConfig] = useState({
    wallet: '0xMockWalletAddress',
    network: 'Ethereum',
  });

  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Payment System Configuration</h1>

        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded shadow ${
                activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-gray-100'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white p-6 rounded shadow">
          {activeTab === 'PayPal' && (
            <PayPalSettings config={paypalConfig} onChange={(key, value) =>
              setPaypalConfig((prev) => ({ ...prev, [key]: value }))
            } />
          )}

          {activeTab === 'Stripe' && (
            <p className="text-gray-500">Stripe settings placeholder</p>
          )}

          {activeTab === 'Bank Transfer' && (
            <p className="text-gray-500">Bank transfer settings placeholder</p>
          )}

          {activeTab === 'Crypto' && (
            <p className="text-gray-500">Crypto settings placeholder</p>
          )}

          {activeTab === 'General' && (
            <p className="text-gray-500">General payment settings placeholder</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
