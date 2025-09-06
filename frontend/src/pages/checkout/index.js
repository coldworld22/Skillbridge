import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function CheckoutRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace({ pathname: '/payments/checkout', query: router.query });
  }, [router]);

  return <p>Redirecting…</p>;
}

