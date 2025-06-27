import PageHead from "@/components/common/PageHead";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";

export default function AdminSupportHome() {
  return (
    <AdminLayout>
      <PageHead title="Support - Admin Dashboard" />
      <div className="px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Support Dashboard</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/dashboard/admin/support/tickets"
            className="block border border-gray-300 bg-white hover:bg-gray-50 shadow rounded-lg p-6 transition"
          >
            <h2 className="text-lg font-semibold text-yellow-600 mb-1">📂 Manage Tickets</h2>
            <p className="text-gray-600 text-sm">View, filter, and respond to all support requests.</p>
          </Link>

          <Link
            href="/dashboard/admin/support/faqs"
            className="block border border-gray-300 bg-white hover:bg-gray-50 shadow rounded-lg p-6 transition"
          >
            <h2 className="text-lg font-semibold text-yellow-600 mb-1">📖 Manage FAQs</h2>
            <p className="text-gray-600 text-sm">Create and organize public support articles.</p>
          </Link>

          <Link
            href="/dashboard/admin/support/settings"
            className="block border border-gray-300 bg-white hover:bg-gray-50 shadow rounded-lg p-6 transition"
          >
            <h2 className="text-lg font-semibold text-yellow-600 mb-1">⚙️ Support Settings</h2>
            <p className="text-gray-600 text-sm">Configure email templates, auto-replies, and more.</p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
