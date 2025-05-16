import { useRouter } from "next/router";
import { useEffect } from "react";

export default function PaymentError() {
  const router = useRouter();
  const { reason = "Payment was cancelled or failed." } = router.query;

  // Optional auto-redirect after 10s
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     router.push("/payments/checkout");
  //   }, 10000);
  //   return () => clearTimeout(timer);
  // }, [router]);

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white px-4 py-16">
      <svg
        className="w-24 h-24 text-red-500 mb-6 animate-pulse"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>

      <h1 className="text-3xl font-bold text-red-400 mb-2">❌ Payment Failed</h1>
      <p className="text-gray-400 text-center max-w-lg mb-6">{reason}</p>

      <div className="flex flex-col sm:flex-row gap-4">
        <a
          href="/payments/checkout"
          className="bg-yellow-400 text-black px-6 py-2 rounded hover:bg-yellow-300 font-semibold transition"
        >
          Retry Payment
        </a>
        <a
          href="/"
          className="border border-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
        >
          Back to Home
        </a>
      </div>

      {/* Optional */}
      {/* <p className="text-sm text-gray-500 mt-4">You will be redirected shortly...</p> */}
    </div>
  );
}
