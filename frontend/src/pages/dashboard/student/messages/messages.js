import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Redirect old student messages route to the shared message center
export default function StudentMessagesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/messages');
  }, [router]);

  return null;
}
