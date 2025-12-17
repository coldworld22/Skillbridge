import { useEffect } from "react";
import { useRouter } from "next/router";

// Redirect legacy admin messages route to the shared message center
export default function AdminMessagesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/messages");
  }, [router]);

  return null;
}
