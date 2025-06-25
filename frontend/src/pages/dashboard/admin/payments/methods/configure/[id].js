import AdminLayout from "@/components/layouts/AdminLayout";
import { useRouter } from "next/router";
import PaymentProviderConfig from "@/components/payments/PaymentProviderConfig";

export default function ConfigurePaymentMethodPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <AdminLayout title="Configure Payment Method">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Configure {id}</h1>
        <PaymentProviderConfig providerId={id} />
      </div>
    </AdminLayout>
  );
}
