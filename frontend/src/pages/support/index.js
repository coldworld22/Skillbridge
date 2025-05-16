import Head from "next/head";
import Link from "next/link";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";

export default function WebsiteSupportHome() {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Head>
        <title>Support - SkillBridge</title>
      </Head>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold text-yellow-500 mb-6">Welcome to the Support Center</h1>
        <p className="text-gray-300 mb-12">
          Find answers, get help, or reach out to our support team. We’re here for you.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          <Link href="/support" className="block bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">📚 Help Center</h2>
            <p className="text-gray-400">Browse FAQs and tutorials by category.</p>
          </Link>

          <Link href="/support/submit" className="block bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">📝 Submit a Ticket</h2>
            <p className="text-gray-400">Can’t find your answer? Let us help you personally.</p>
          </Link>

          <Link href="/support/ticket-status" className="block bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">📄 My Tickets</h2>
            <p className="text-gray-400">Check the status of your support requests.</p>
          </Link>

          <Link href="/support/contact" className="block bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">📨 Contact Us</h2>
            <p className="text-gray-400">Have a general inquiry? Send us a message.</p>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}