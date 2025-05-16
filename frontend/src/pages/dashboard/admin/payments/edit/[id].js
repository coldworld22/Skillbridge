import { useRouter } from 'next/router';
import PaymentProviderConfig from '@/components/payments/PaymentProviderConfig';

export default function EditPaymentProviderDashboard() {
  const { id } = useRouter().query;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Configure {id?.toUpperCase()} Settings</h1>
      <PaymentProviderConfig providerId={id} />
    </div>
  );
}
