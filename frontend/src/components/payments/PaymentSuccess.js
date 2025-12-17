// components/payments/PaymentSuccess.js
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccess() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center">
      <CheckCircle className="text-yellow-400 w-16 h-16 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
      <p className="mb-6 text-gray-600">Thank you for your purchase.</p>
      <Link href="/">
        <span className="bg-yellow-400 text-white px-6 py-2 rounded-full hover:bg-yellow-500 transition">
          Go to Homepage
        </span>
      </Link>
    </div>
  );
}
