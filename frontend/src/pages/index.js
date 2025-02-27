import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/auth/login"); // ✅ Correct path
  }, []);

  return null; // Empty page, as it redirects automatically
}
