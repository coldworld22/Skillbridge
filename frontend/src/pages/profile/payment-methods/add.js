import PaymentMethodForm from '@/components/payments/PaymentMethodForm';

export default function AddPaymentMethodPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Add a New Payment Method</h1>
      <PaymentMethodForm />
    </div>
  );
}
