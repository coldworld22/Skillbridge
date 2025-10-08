// pages/admin/moderation.js
import AdminLayout from "@/components/layouts/AdminLayout";
import MessageFlagLog from "@/components/admin/security/MessageFlagLog";

export default function ModerationPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🛡️ Moderation Center</h1>
      <p className="text-sm text-gray-600 mb-4">
        Review messages flagged for inappropriate language during live classes.
      </p>
      <MessageFlagLog />
    </div>
  );
}

ModerationPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
