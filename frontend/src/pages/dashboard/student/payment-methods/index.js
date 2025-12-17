import Link from 'next/link';
import PaymentMethodList from '@/components/payments/PaymentMethodList';

export default function StudentPaymentMethodsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Your Payment Methods</h1>
        <Link href="/dashboard/student/payment-methods/add">
          <span className="bg-yellow-400 text-white px-4 py-2 rounded-full hover:bg-yellow-500 cursor-pointer">
            Add Method
          </span>
        </Link>
      </div>
      <PaymentMethodList />
    </div>
  );
}
