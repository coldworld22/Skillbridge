import Head from "next/head";
import Link from "next/link";
import StudentLayout from "@/components/layouts/StudentLayout";

export default function StudentSupportHome() {
  return (
    <StudentLayout>
      <Head>
        <title>Support - Dashboard | SkillBridge</title>
      </Head>
      <div className="px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Support Center</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/support"
            className="block border border-gray-300 bg-white hover:bg-gray-50 shadow rounded-lg p-6 transition"
          >
            <h2 className="text-lg font-semibold text-yellow-600 mb-1">📚 Help Center</h2>
            <p className="text-gray-600 text-sm">Browse FAQs and articles on common topics.</p>
          </Link>

          <Link
            href="/support/submit"
            className="block border border-gray-300 bg-white hover:bg-gray-50 shadow rounded-lg p-6 transition"
          >
            <h2 className="text-lg font-semibold text-yellow-600 mb-1">📝 Submit a Ticket</h2>
            <p className="text-gray-600 text-sm">Need help? Reach out with a detailed request.</p>
          </Link>

          <Link
            href="/dashboard/student/support/my-tickets"
            className="block border border-gray-300 bg-white hover:bg-gray-50 shadow rounded-lg p-6 transition"
          >
            <h2 className="text-lg font-semibold text-yellow-600 mb-1">📄 My Tickets</h2>
            <p className="text-gray-600 text-sm">View and manage your previous support tickets.</p>
          </Link>
        </div>
      </div>
    </StudentLayout>
  );
}