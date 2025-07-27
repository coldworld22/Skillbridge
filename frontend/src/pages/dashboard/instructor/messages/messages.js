import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Redirect old instructor messages route to the shared message center
export default function InstructorMessagesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/messages');
  }, [router]);

  return null;
}
