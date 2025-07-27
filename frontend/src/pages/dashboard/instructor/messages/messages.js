// pages/dashboard/instructor/messages.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function InstructorMessagesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/messages');
  }, [router]);

  return null;
}
