import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import AdminLayout from "@/components/layouts/AdminLayout";
import UserList from "@/components/admin/users/UserList";
import { fetchAllUsers } from "@/services/admin/userService";
import useAuthStore from "@/store/auth/authStore";
import withAuthProtection from "@/hooks/withAuthProtection";
import { toast } from "react-toastify";
import logger from "@/utils/logger";

function UsersPage() {
  const { t } = useTranslation("dashboard");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);

  const router = useRouter();
  const { accessToken, user, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!accessToken || !user) {
      router.replace("/auth/login");
      return;
    }

    const loadUsers = async () => {
      try {
        const data = await fetchAllUsers(); // ✅ No token needed (cookie session)
        logger.log("✅ API returned users:", data);

        const formatted = (data ?? []).map((u) => {
          const rawLastLogin = u.last_login_at || u.last_login || null;
          const lastLoginDate = rawLastLogin ? new Date(rawLastLogin) : null;
          const lastLoginDisplay =
            lastLoginDate && !Number.isNaN(lastLoginDate.getTime())
              ? lastLoginDate.toLocaleString()
              : null;

          return {
            ...u,
            name: u.full_name || u.email?.split("@")[0],
            createdAt: u.created_at,
            status: u.status?.toLowerCase() ?? "pending", // ✅ ensure status exists
            role: u.role?.toLowerCase() ?? "student",
            lastLogin: lastLoginDate && !Number.isNaN(lastLoginDate.getTime())
              ? lastLoginDate.toISOString()
              : null,
            lastLoginDisplay,
            avatar_url: u.avatar_url
              ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${u.avatar_url}`
              : null,
          };
        });

        setUsers(formatted);
      } catch (err) {
        toast.error("Error fetching users");
        logger.error("❌ Error loading users:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [accessToken, hasHydrated, router, user]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{t("usersPage.title")}</h1>
          <button
            onClick={() => router.push("/dashboard/admin/users/create")}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
          >
            + {t("usersPage.add_user")}
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-xl border shadow-sm p-5 space-y-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-1/4 mt-4"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <UserList users={users} setUsers={setUsers} />
        )}
      </div>
    </AdminLayout>
  );
}

const ProtectedUsersPage = withAuthProtection(UsersPage, {
  permissions: ["view_users"],
});

export default ProtectedUsersPage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard", "auth"], nextI18NextConfig)),
    },
  };
}
