import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function CheckoutRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/payments/checkout' + window.location.search);
  }, [router]);

  return <p>Redirecting…</p>;
}

