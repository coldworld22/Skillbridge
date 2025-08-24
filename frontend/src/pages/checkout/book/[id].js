import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function BookCheckoutRedirect() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      router.replace(`/payments/checkout?itemType=book&itemId=${id}`);
    }
  }, [id, router]);

  return <p className="text-white text-center mt-32">Redirecting...</p>;
}
