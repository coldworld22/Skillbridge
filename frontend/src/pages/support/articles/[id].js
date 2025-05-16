import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";

// Mock FAQ data (to be replaced with real API or CMS)
const mockArticles = {
  1: {
    title: "How can I request a refund?",
    content: "To request a refund, please visit your account dashboard, go to 'My Purchases', and select the 'Request Refund' option. Note that our refund policy allows refunds within 14 days of purchase, provided the course was not completed.",
  },
  2: {
    title: "What payment methods are supported?",
    content: "We currently accept Visa, MasterCard, PayPal, and USDT. For other payment options, please contact support.",
  },
  3: {
    title: "How do I join a live class?",
    content: "Log into your dashboard, go to 'My Classes', and click the 'Join Live' button next to the active session. Live classes are hosted via Zoom or our in-app player.",
  },
  // ... more mock data
};

export default function ArticlePage() {
  const router = useRouter();
  const { id } = router.query;
  const article = mockArticles[id];

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Head>
        <title>{article ? `${article.title} - Support` : 'Loading...'} | SkillBridge</title>
      </Head>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-24">
        {article ? (
          <>
            <h1 className="text-2xl font-bold text-yellow-500 mb-6">{article.title}</h1>
            <p className="text-gray-300 leading-relaxed mb-12 whitespace-pre-line">{article.content}</p>
            <Link href="/support" className="text-blue-400 hover:underline">← Back to Help Center</Link>
          </>
        ) : (
          <p className="text-center text-gray-400">Loading article...</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
