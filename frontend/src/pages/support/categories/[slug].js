import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";

const mockFaqCategories = {
  billing: {
    title: "Billing & Payments",
    faqs: [
      { id: 1, question: "How can I request a refund?" },
      { id: 2, question: "What payment methods are supported?" },
    ],
  },
  classes: {
    title: "Online Classes",
    faqs: [
      { id: 3, question: "How do I join a live class?" },
      { id: 4, question: "Can I access completed lessons?" },
    ],
  },
  technical: {
    title: "Technical Support",
    faqs: [
      { id: 5, question: "Why can’t I log in?" },
      { id: 6, question: "Video won’t play, what do I do?" },
    ],
  },
};

export default function SupportCategoryPage() {
  const router = useRouter();
  const { slug } = router.query;
  const category = mockFaqCategories[slug];

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Head>
        <title>{category ? `${category.title} - Support` : 'Loading...'} | SkillBridge</title>
      </Head>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-20">
        {category ? (
          <>
            <h1 className="text-3xl font-bold text-yellow-500 mb-6">{category.title}</h1>
            <ul className="list-disc pl-6 space-y-2">
              {category.faqs.map((faq) => (
                <li key={faq.id}>
                  <Link href={`/support/articles/${faq.id}`} className="text-blue-400 hover:underline">
                    {faq.question}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-12">
              <Link href="/support" className="text-blue-400 hover:underline">← Back to Help Center</Link>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-400">Loading category...</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
