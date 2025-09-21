// Admin Edit Payment Provider Page
import { useRouter } from 'next/router';
import PaymentProviderConfig from '@/components/payments/PaymentProviderConfig';

export default function EditPaymentProviderPage() {
  const router = useRouter();
  const { id } = router.query;
  const isStringId = typeof id === 'string' && id.length > 0;
  const heading = isStringId ? id.toUpperCase() : '...';
  const shouldRenderConfig = router.isReady && isStringId;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Configure {heading} Settings</h1>
      {shouldRenderConfig ? (
        <PaymentProviderConfig providerId={id} />
      ) : (
        <div className="h-24 rounded bg-gray-100" aria-busy="true" aria-live="polite" />
      )}
    </div>
  );
}
