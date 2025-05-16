// Admin Edit Payment Provider Page
import { useRouter } from 'next/router';
import PaymentProviderConfig from '@/components/payments/PaymentProviderConfig';

export default function EditPaymentProviderPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Configure {id?.toUpperCase()} Settings</h1>
      <PaymentProviderConfig providerId={id} />
    </div>
  );
}
