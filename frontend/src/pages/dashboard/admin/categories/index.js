// ─────────────────────────────────────────────────────────
// Admin Category Management
// See docs/admin-category-management.md
// ─────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  FolderKanban,
  Pencil,
  Trash2,
  Eye,
  X,
  Loader2,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import {
  fetchAllCategories,
  deleteCategory,
  updateCategoryStatus,
} from "@/services/admin/categoryService";
import { API_BASE_URL } from "@/config/config";
import { toast } from "react-toastify";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
const normalizeImageUrl = (src) => {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL || "").replace(/\/$/, "");
  return `${base}/${src.replace(/^\/+/g, "")}`;
};

const FALLBACK_ICON = "FolderKanban";
const AVATAR_SIZES = {
  table: { wrapper: "h-12 w-12", icon: "h-6 w-6" },
  card: { wrapper: "h-14 w-14", icon: "h-7 w-7" },
  detail: { wrapper: "h-20 w-20", icon: "h-10 w-10" },
};

const getIconComponent = (iconName) => {
  if (!iconName) return null;
  return LucideIcons[iconName] || null;
};

const renderCategoryAvatar = (category, size = "table") => {
  const IconComponent = getIconComponent(category?.icon) || LucideIcons[FALLBACK_ICON];
  if (IconComponent) {
    const sizeClasses = AVATAR_SIZES[size] || AVATAR_SIZES.table;
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-primary/10 text-primary ${sizeClasses.wrapper}`}
        aria-hidden="true"
      >
        <IconComponent className={sizeClasses.icon} />
      </div>
    );
  }

  const fallback = normalizeImageUrl(category?.image_url);
  return (
    <img
      src={fallback || "https://via.placeholder.com/96x96?text=Category"}
      alt={category?.name || "Category"}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "https://via.placeholder.com/96x96?text=Category";
      }}
      className={`${(AVATAR_SIZES[size] || AVATAR_SIZES.table).wrapper} rounded-md object-cover shadow-sm`}
    />
  );
};

// ─────────────────────────────────────────────────────────
// Admin Category Index Component
// ─────────────────────────────────────────────────────────

function AdminCategoryIndex() {
  const { t, i18n } = useTranslation("dashboard", { keyPrefix: "categoriesPage" });
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 0 });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAllCategories({
        search,
        status: statusFilter,
        limit: 500,
      });

      const list = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
        ? result
        : [];

      setCategories(list);
      setMeta({
        total: result?.total ?? list.length,
        page: result?.page ?? 1,
        limit: result?.limit ?? list.length,
      });
    } catch (err) {
      console.error("Failed to fetch categories", err);
      setError(t("error"));
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          t("error")
      );
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (list, parentId = null) =>
    list
      .filter((item) => (item.parent_id ?? null) === parentId)
      .map((item) => ({
        ...item,
        children: buildTree(list, item.id),
      }));

  const categoryTree = useMemo(() => buildTree(categories), [categories]);

  const parentNameById = useMemo(() => {
    const lookup = {};
    categories.forEach((cat) => {
      lookup[cat.id] = cat.name;
    });
    return lookup;
  }, [categories]);

  const getParentLabel = (category) => {
    if (!category?.parent_id) return t("none_top_level");
    return parentNameById[category.parent_id] || t("unknown_parent");
  };

  const formatDate = (value) => {
    if (!value) return t("not_available");
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? t("not_available") : date.toLocaleString();
  };

  const openDetails = (category) => {
    setSelectedCategory(category);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedCategory(null);
  };

  const toggleStatus = async (id, currentStatus, name) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const confirmation = t("confirm_status", {
      name,
      status: t(newStatus),
    });

    if (!window.confirm(confirmation)) return;

    setStatusUpdatingId(id);

    try {
      await updateCategoryStatus(id, newStatus);
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === id
            ? {
                ...cat,
                status: newStatus,
              }
            : cat
        )
      );

      setSelectedCategory((prev) =>
        prev && prev.id === id ? { ...prev, status: newStatus } : prev
      );

      toast.success(t("status_updated"));
    } catch (err) {
      console.error("Failed to update status", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("update_failed");
      toast.error(msg);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(t("confirm_delete", { name }))) return;

    setDeletingId(id);
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      if (selectedCategory?.id === id) {
        closeDetails();
      }
      setMeta((prev) => ({
        ...prev,
        total: Math.max(0, (prev.total || 1) - 1),
      }));
      toast.success(t("category_deleted"));
    } catch (err) {
      console.error("Failed to delete category", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("delete_failed");
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const renderStatusButton = (node) => {
    const isActive = node.status === "active";
    const isUpdating = statusUpdatingId === node.id;
    return (
      <button
        type="button"
        onClick={() => toggleStatus(node.id, node.status, node.name)}
        disabled={isUpdating}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
          isActive
            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        } ${isUpdating ? "cursor-wait opacity-75" : ""}`}
      >
        {isUpdating ? (
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        ) : null}
        <span>{t(node.status)}</span>
      </button>
    );
  };

  const renderRows = (nodes, level = 0) =>
    nodes.flatMap((node) => [
      <tr
        key={node.id}
        className={`border-b border-gray-100 text-sm text-gray-700 ${
          level === 0 ? "bg-gray-50/70" : "bg-white"
        }`}
      >
        <td
          className="px-4 py-3 align-middle"
          style={{ paddingInlineStart: `${20 + level * 24}px` }}
        >
          <div className="flex flex-col gap-1">
            <span className="font-medium text-gray-900">{node.name}</span>
            {level > 0 && (
              <span className="w-fit rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                {t("subcategory")}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 align-middle">
          {renderCategoryAvatar(node, "table")}
        </td>
        <td className="px-4 py-3 align-middle text-center text-sm text-gray-600">
          {typeof node.classes_count === "number" ? node.classes_count : "—"}
        </td>
        <td className="px-4 py-3 align-middle">{renderStatusButton(node)}</td>
        <td className="px-4 py-3 align-middle text-right">
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => openDetails(node)}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              <Eye size={14} aria-hidden="true" />
              {t("view")}
            </button>
            <Link href={`/dashboard/admin/categories/edit/${node.id}`}>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-semibold text-yellow-700 transition hover:bg-yellow-200"
                title={t("edit")}
              >
                <Pencil size={14} aria-hidden="true" />
                {t("edit")}
              </button>
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(node.id, node.name)}
              disabled={deletingId === node.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {deletingId === node.id ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 size={14} aria-hidden="true" />
              )}
              {t("delete")}
            </button>
          </div>
        </td>
      </tr>,
      ...(node.children && node.children.length > 0
        ? renderRows(node.children, level + 1)
        : []),
    ]);

  const renderMobileCards = (nodes, level = 0) =>
    nodes.flatMap((node) => {
      const isDeleting = deletingId === node.id;
      return [
        <div
          key={`${node.id}-card`}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          style={{ marginInlineStart: level * 12 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-gray-900">{node.name}</p>
              {level > 0 && (
                <p className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                  {t("subcategory")}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {t("parent_label", { parent: getParentLabel(node) })}
              </p>
            </div>
            {renderCategoryAvatar(node, "card")}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="rounded-full bg-gray-100 px-2 py-1">
              {t("classes_count", {
                count:
                  typeof node.classes_count === "number" ? node.classes_count : 0,
              })}
            </span>
            {renderStatusButton(node)}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openDetails(node)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              <Eye size={14} aria-hidden="true" />
              {t("view")}
            </button>
            <Link href={`/dashboard/admin/categories/edit/${node.id}`} className="flex-1">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-yellow-100 px-3 py-2 text-xs font-semibold text-yellow-700 transition hover:bg-yellow-200"
              >
                <Pencil size={14} aria-hidden="true" />
                {t("edit")}
              </button>
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(node.id, node.name)}
              disabled={isDeleting}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isDeleting ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 size={14} aria-hidden="true" />
              )}
              {t("delete")}
            </button>
          </div>
        </div>,
        ...(node.children && node.children.length > 0
          ? renderMobileCards(node.children, level + 1)
          : []),
      ];
    });

  const renderContent = () => {
    if (loading) {
      return (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
          <Loader2 size={28} className="mx-auto mb-3 animate-spin text-primary" aria-hidden="true" />
          <p>{t("loading")}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          {error}
        </div>
      );
    }

    if (!categoryTree.length) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
          {t("no_categories")}{" "}
          <Link
            href="/dashboard/admin/categories/create"
            className="font-semibold text-primary underline decoration-from-font underline-offset-2"
          >
            {t("create_one_now")}
          </Link>
        </div>
      );
    }

    return (
      <>
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm" dir={i18n.dir()}>
            <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("name")}</th>
                <th className="px-4 py-3 font-semibold">{t("image")}</th>
                <th className="px-4 py-3 text-center font-semibold">{t("classes")}</th>
                <th className="px-4 py-3 font-semibold">{t("status")}</th>
                <th className="px-4 py-3 text-right font-semibold">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>{renderRows(categoryTree)}</tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">{renderMobileCards(categoryTree)}</div>
      </>
    );
  };

  const showingFrom = categories.length ? 1 : 0;
  const showingTo = categories.length;
  const summaryLabel = t("showing_count", {
    from: showingFrom,
    to: showingTo,
    total: meta.total || showingTo,
  });

  return (
    <div className="space-y-6 p-6" dir={i18n.dir()}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <FolderKanban className="text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{t("title")}</h2>
            <p className="text-sm text-gray-500">{t("subtitle")}</p>
          </div>
        </div>
        <Link href="/dashboard/admin/categories/create">
          <button className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90">
            <Plus size={16} aria-hidden="true" /> {t("new_category")}
          </button>
        </Link>
      </div>

      <div className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} aria-hidden="true" />
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-700 shadow-inner focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label={t("search_placeholder")}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label={t("status_label")}
        >
          <option value="all">{t("all_statuses")}</option>
          <option value="active">{t("active")}</option>
          <option value="inactive">{t("inactive")}</option>
        </select>
        <button
          type="button"
          onClick={fetchCategories}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
        >
          <Loader2
            size={14}
            className={`transition ${loading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {t("refresh")}
        </button>
      </div>

      {renderContent()}

      <div className="flex flex-col gap-2 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
        <span>{summaryLabel}</span>
        <span className="text-xs text-gray-400">{t("last_updated_notice")}</span>
      </div>

      {detailsOpen && selectedCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" dir={i18n.dir()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{t("view_details")}</h3>
                <p className="text-sm text-gray-500">{t("details_subtitle")}</p>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="rounded-full bg-gray-100 p-1.5 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
                aria-label={t("close")}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-sm text-gray-600">
              <div className="flex items-center gap-4">
                {renderCategoryAvatar(selectedCategory, "detail")}
                <div>
                  <p className="text-lg font-semibold text-gray-900">{selectedCategory.name}</p>
                  <p className="text-xs text-gray-500">
                    {selectedCategory.parent_id
                      ? t("child_of", { parent: getParentLabel(selectedCategory) })
                      : t("top_level")}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-gray-500">{t("slug_label")}</dt>
                  <dd className="mt-1 break-all text-gray-900">
                    {selectedCategory.slug || t("not_available")}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500">{t("icon_label")}</dt>
                  <dd className="mt-1 text-gray-900">
                    {selectedCategory.icon || t("not_available")}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500">{t("status_label")}</dt>
                  <dd className="mt-1">{renderStatusButton(selectedCategory)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500">{t("parent_category")}</dt>
                  <dd className="mt-1 text-gray-900">{getParentLabel(selectedCategory)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500">{t("classes")}</dt>
                  <dd className="mt-1 text-gray-900">
                    {typeof selectedCategory.classes_count === "number"
                      ? selectedCategory.classes_count
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500">{t("created_at")}</dt>
                  <dd className="mt-1 text-gray-900">{formatDate(selectedCategory.created_at)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500">{t("updated_at")}</dt>
                  <dd className="mt-1 text-gray-900">{formatDate(selectedCategory.updated_at)}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Link href={`/dashboard/admin/categories/edit/${selectedCategory.id}`}>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700 transition hover:bg-yellow-200"
                >
                  <Pencil size={16} aria-hidden="true" />
                  {t("edit")}
                </button>
              </Link>
              <button
                type="button"
                onClick={closeDetails}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

AdminCategoryIndex.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedAdminCategoryIndex = withAuthProtection(AdminCategoryIndex, [
  "admin",
  "superadmin",
]);

ProtectedAdminCategoryIndex.getLayout = AdminCategoryIndex.getLayout;

export default ProtectedAdminCategoryIndex;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
