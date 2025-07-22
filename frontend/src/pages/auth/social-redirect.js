import { useRouter } from "next/router";
import { useEffect } from "react";
import useAuthStore from "@/store/auth/authStore";

export default function SocialRedirect() {
  const router = useRouter();
  const { token } = router.query;
  const loginWithToken = useAuthStore((state) => state.loginWithToken);

  useEffect(() => {
    if (token) {
      loginWithToken(token).finally(() => {
        router.replace("/website");
      });
    }
  }, [token, loginWithToken, router]);

  return <p>Signing you in...</p>;
}
