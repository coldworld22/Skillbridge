import { useEffect, useState } from 'react';

export default function PaymentMethodList() {
  const [methods, setMethods] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('savedPaymentMethods')) || [];
      setMethods(Array.isArray(saved) ? saved : []);
    } catch {
      setMethods([]);
    }
  }, []);

  if (methods.length === 0) {
    return <p className="text-gray-500">No payment methods saved.</p>;
  }

  return (
    <ul className="space-y-2">
      {methods.map((method, idx) => (
        <li key={idx} className="border p-3 rounded-lg bg-white">
          {method}
        </li>
      ))}
    </ul>
  );
}
