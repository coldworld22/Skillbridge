// Admin Payment Methods List Page
import Link from 'next/link';

const dummyGateways = [
  { id: 'paypal', name: 'PayPal', enabled: true },
  { id: 'stripe', name: 'Stripe', enabled: false },
];



export default function AdminPaymentsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Payment Gateways</h1>
      <ul className="space-y-4">
        {dummyGateways.map((gw) => (
          <li key={gw.id} className="bg-white shadow p-4 rounded-xl flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">{gw.name}</h2>
              <p className={`text-sm ${gw.enabled ? 'text-green-600' : 'text-red-500'}`}>
                {gw.enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <Link href={`/admin/payments/edit/${gw.id}`}>
              <span className="px-4 py-2 bg-yellow-400 text-white rounded-full hover:bg-yellow-500 transition cursor-pointer">Edit</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
