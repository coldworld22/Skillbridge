import PageHead from "@/components/common/PageHead";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";
import { FiFolder, FiSettings, FiVolume2 } from "react-icons/fi"; // icon set

function SupportCard({ href, title, description, Icon, color }) {
  return (
    <Link
      href={href}
      className="block border border-gray-200 bg-white hover:bg-gray-50 shadow rounded-2xl p-6 transition"
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`text-xl ${color}`} />
        <h2 className={`text-lg font-semibold ${color}`}>{title}</h2>
      </div>
      <p className="text-gray-600 text-sm">{description}</p>
    </Link>
  );
}

export default function AdminSupportHome() {
  return (
    <AdminLayout>
      <PageHead title="Support - Admin Dashboard" />

      <div className="px-6 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Support Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome to the admin support center. Use the tools below to manage tickets, announcements, and settings.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SupportCard
            href="/dashboard/admin/support/tickets"
            title="Manage Tickets"
            description="View, filter, and respond to all support requests."
            Icon={FiFolder}
            color="text-yellow-600"
          />
          <SupportCard
            href="/dashboard/admin/support/announcements"
            title="Announcements"
            description="Create and manage system-wide support notices."
            Icon={FiVolume2}
            color="text-blue-600"
          />
          <SupportCard
            href="/dashboard/admin/support/settings"
            title="Settings"
            description="Configure support categories, auto-replies, and team access."
            Icon={FiSettings}
            color="text-purple-600"
          />
        </div>
      </div>
    </AdminLayout>
  );
}
