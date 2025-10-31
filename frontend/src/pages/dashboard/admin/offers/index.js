import { useEffect, useState } from "react";
import {
  FaSearch,
  FaEye,
  FaTrashAlt,
  FaUserShield,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  fetchOffers,
  updateOffer,
  deleteOffer,
} from "@/services/admin/offerService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import withAuthProtection from "@/hooks/withAuthProtection";

const AdminOfferDashboard = () => {
  const { t } = useTranslation("dashboard");
  const [offers, setOffers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [filterRole, setFilterRole] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 5;

  const getStatusLabel = (status) => {
    switch ((status || "").toLowerCase()) {
      case "open":
        return t("adminOffersPage.status_open");
      case "closed":
        return t("adminOffersPage.status_closed");
      case "cancelled":
        return t("adminOffersPage.status_cancelled");
      default:
        return status || "unknown";
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterRole, statusFilter]);

  useEffect(() => {
    fetchOffers()
      .then((data) => {
        const mapped = data.map((o) => {
          const ownerRole = o?.student_role ? o.student_role.toLowerCase() : "";
          const avatarPath = o?.student_avatar || "";
          const createdAt = o?.created_at ? new Date(o.created_at) : null;
          const expiresAt = o?.expires_at ? new Date(o.expires_at) : null;
          const avatarUrl =
            avatarPath && (avatarPath.startsWith("http://") || avatarPath.startsWith("https://"))
              ? avatarPath
              : avatarPath
              ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${avatarPath}`
              : "/avatars/default.jpg";

          return {
            id: o.id,
            title: o.title,
            user: {
              id: o.student_id,
              name: o.student_name,
              role: o.student_role,
              avatar: avatarUrl,
            },
            type: ownerRole === "instructor" ? "instructor" : "student",
            status: (o.status || "open").toLowerCase(),
            createdAt,
            createdAtLabel: createdAt
              ? createdAt.toLocaleDateString()
              : "",
            expiresAt,
            expiresAtLabel: expiresAt ? expiresAt.toLocaleDateString() : "",
          };
        });
        setOffers(mapped);
      })
      .catch(() => setOffers([]));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm(t("adminOffersPage.confirm_delete"))) return;
    const prev = offers;
    setOffers((prevOffers) => prevOffers.filter((o) => o.id !== id));
    try {
      await deleteOffer(id);
      toast.success(t("adminOffersPage.offer_deleted"));
    } catch (_) {
      setOffers(prev);
      toast.error(t("adminOffersPage.delete_failed"));
    }
  };

  const handleToggleStatus = async (id) => {
    const offer = offers.find((o) => o.id === id);
    if (!offer) return;
    const previous = offer.status;
    const newStatus = offer.status === "open" ? "closed" : "open";
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
    try {
      await updateOffer(id, { status: newStatus });
      toast.success(t("adminOffersPage.status_updated"));
    } catch (_) {
      setOffers((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: previous } : o))
      );
      toast.error(t("adminOffersPage.status_update_failed"));
    }
  };

  const lowerSearch = searchTerm.trim().toLowerCase();

  const filtered = offers
    .filter((o) => {
      if (!lowerSearch) return true;
      const title = o.title?.toLowerCase() || "";
      const owner = o.user?.name?.toLowerCase() || "";
      return title.includes(lowerSearch) || owner.includes(lowerSearch);
    })
    .filter((o) => (filterRole ? o.type === filterRole : true))
    .filter((o) =>
      statusFilter === "all" ? true : o.status === statusFilter
    )
    .sort((a, b) => {
      const aTime = a.createdAt ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt ? b.createdAt.getTime() : 0;
      return sortAsc ? aTime - bTime : bTime - aTime;
    });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="p-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">📋 {t("adminOffersPage.title")}</h1>

        <div className="flex flex-wrap items-center gap-3">
          <select
            onChange={(e) => setFilterRole(e.target.value)}
            value={filterRole}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="">{t("adminOffersPage.all_roles")}</option>
            <option value="instructor">{t("adminOffersPage.instructor")}</option>
            <option value="student">{t("adminOffersPage.student")}</option>
          </select>

          <select
            onChange={(e) => setStatusFilter(e.target.value)}
            value={statusFilter}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="all">{t("adminOffersPage.status_all")}</option>
            <option value="open">{t("adminOffersPage.status_open")}</option>
            <option value="closed">{t("adminOffersPage.status_closed")}</option>
            <option value="cancelled">{t("adminOffersPage.status_cancelled")}</option>
          </select>

          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="text-sm px-3 py-1 bg-gray-100 border rounded text-gray-700 hover:bg-gray-200 flex items-center gap-1"
          >
            {sortAsc ? <FaSortAmountDown /> : <FaSortAmountUp />} {t("adminOffersPage.sort_by_date")}
          </button>

          <div className="flex items-center border border-gray-300 rounded px-2 py-1 bg-white shadow-sm">
            <FaSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder={t("adminOffersPage.search_title")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="outline-none text-sm w-48"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full text-sm text-gray-800">
          <thead className="bg-gray-100 text-left uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-3">{t("adminOffersPage.column_title")}</th>
              <th className="px-4 py-3">{t("adminOffersPage.column_user")}</th>
              <th className="px-4 py-3">{t("adminOffersPage.column_type")}</th>
              <th className="px-4 py-3">{t("adminOffersPage.column_status")}</th>
              <th className="px-4 py-3">{t("adminOffersPage.column_date")}</th>
              <th className="px-4 py-3 text-right">{t("adminOffersPage.column_actions")}</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((offer) => (
              <tr key={offer.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium truncate max-w-xs">{offer.title}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={offer.user.avatar}
                      alt={offer.user.name}
                      className="w-8 h-8 rounded-full object-cover border"
                    />
                    <div>
                      <p className="font-semibold">{offer.user.name}</p>
                      <p className="text-xs text-gray-500">{offer.user.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    offer.type === "instructor"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {offer.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        offer.status === "open"
                          ? "text-green-600"
                          : offer.status === "cancelled"
                          ? "text-red-600"
                          : "text-amber-600"
                      }`}
                    >
                      {getStatusLabel(offer.status)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(offer.id)}
                      className={`relative inline-flex w-14 h-7 items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        offer.status === "open"
                          ? "bg-green-400 focus:ring-green-500"
                          : "bg-red-400 focus:ring-red-500"
                      }`}
                      aria-pressed={offer.status === "open"}
                      aria-label={`${t("adminOffersPage.column_status")}: ${getStatusLabel(offer.status)}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                          offer.status === "open" ? "translate-x-7" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  <div>{offer.createdAtLabel}</div>
                  {offer.expiresAtLabel && (
                    <div className="text-xs text-gray-400">
                      {t("offersPage.field_expires_at")}: {offer.expiresAtLabel}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right flex justify-end gap-2">
                  <Link href={`/dashboard/admin/offers/${offer.id}`}>
                    <button className="text-blue-600 hover:text-blue-800" title="View">
                      <FaEye />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete Offer"
                  >
                    <FaTrashAlt />
                  </button>
                  <button className="text-yellow-600 hover:text-yellow-800" title="Flag User">
                    <FaUserShield />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-6 gap-3">
        <button
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
        >
          {t("adminOffersPage.prev")}
        </button>
        <button
          disabled={page * perPage >= filtered.length}
          onClick={() => setPage((prev) => prev + 1)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
        >
          {t("adminOffersPage.next")}
        </button>
      </div>
    </div>
  );
};
const ProtectedAdminOfferDashboard = withAuthProtection(AdminOfferDashboard, [
  "admin",
  "superadmin",
]);

ProtectedAdminOfferDashboard.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);

export default ProtectedAdminOfferDashboard;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["common", "dashboard"],
        nextI18NextConfig
      )),
    },
  };
}
