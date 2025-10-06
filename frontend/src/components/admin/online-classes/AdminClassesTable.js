import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  fetchAdminClasses,
  deleteAdminClass,
  approveAdminClass,
  rejectAdminClass,
  toggleClassStatus,
} from "@/services/admin/classService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import {
  FaCalendarAlt,
  FaChartBar,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaList,
  FaPlay,
  FaPause,
  FaSearch,
  FaTimes,
  FaTrash,
  FaUserGraduate,
  FaCheck,
} from "react-icons/fa";

const BACKEND_STATUSES = new Set(["draft", "published", "archived"]);
const STATUS_OPTIONS = ["All", "Upcoming", "Ongoing", "Completed", "Draft", "Published", "Archived"];
const APPROVAL_OPTIONS = ["All", "Approved", "Pending", "Rejected"];
const PAGE_SIZE_OPTIONS = ["5", "10", "20", "all"];
const DEFAULT_PAGE_SIZE = 5;
const MIN_REJECTION_REASON_LENGTH = 3;

const normalizeStatusValue = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export const mapStatusFilterToQuery = (filterStatus) => {
  const normalized = normalizeStatusValue(filterStatus);

  if (!normalized || normalized === "all") {
    return undefined;
  }

  return BACKEND_STATUSES.has(normalized) ? normalized : undefined;
};

export const compareValues = (a, b, key) => {
  const valueA = a?.[key];
  const valueB = b?.[key];

  if (valueA === valueB) {
    return 0;
  }

  const numericA =
    typeof valueA === "number" ? valueA : Date.parse(valueA ?? "");
  const numericB =
    typeof valueB === "number" ? valueB : Date.parse(valueB ?? "");

  if (Number.isFinite(numericA) && Number.isFinite(numericB)) {
    return numericA - numericB;
  }

  if (typeof valueA === "string" && typeof valueB === "string") {
    return valueA.localeCompare(valueB);
  }

  return 0;
};

const resolvePositiveInteger = (value, fallback = 1) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  return fallback;
};

const normalizeNonNegativeInteger = (value, fallback = 0) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return Math.floor(parsed);
  }
  return fallback;
};

const shouldApplyScheduleFilter = (filterStatus) => {
  const normalized = normalizeStatusValue(filterStatus);
  if (!normalized || normalized === "all") {
    return false;
  }
  return !BACKEND_STATUSES.has(normalized);
};

const sanitizeClassList = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => item && typeof item === "object");
};

const deriveScheduleStatus = (cls) => {
  const raw =
    cls?.scheduleStatus ??
    cls?.schedule_status ??
    cls?.schedule ??
    cls?.statusSchedule;
  return normalizeStatusValue(raw);
};

const derivePublishStatus = (cls) => {
  const raw =
    cls?.publishStatus ??
    cls?.status ??
    cls?.state ??
    cls?.status_label;
  return normalizeStatusValue(raw);
};

const deriveApprovalStatus = (cls) => {
  const raw =
    cls?.approvalStatus ??
    cls?.approval_status ??
    cls?.approval ??
    cls?.approval_state;
  return raw || "";
};

const normalizeClassRecord = (item) => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const id = item.id ?? item._id ?? item.class_id ?? item.slug;
  if (id === undefined || id === null) {
    return null;
  }

  const instructorName =
    item.instructor?.name ??
    item.instructor_name ??
    item.instructor ??
    item.teacher ??
    "";

  const instructorEmail =
    item.instructor?.email ?? item.instructor_email ?? "";

  const priceValue =
    typeof item.price === "number"
      ? item.price
      : Number.parseFloat(item.price);

  return {
    id: String(id),
    title: item.title ?? item.name ?? "Untitled class",
    instructor: instructorName || instructorEmail || "",
    start_date:
      item.start_date ??
      item.startDate ??
      item.start_time ??
      "",
    end_date:
      item.end_date ??
      item.endDate ??
      item.end_time ??
      "",
    category: item.category ?? item.category_name ?? "",
    price: Number.isFinite(priceValue) ? priceValue : 0,
    publishStatus: derivePublishStatus(item),
    approvalStatus: deriveApprovalStatus(item),
    scheduleStatus: deriveScheduleStatus(item),
  };
};

const parseMeta = (meta) => {
  if (!meta || typeof meta !== "object") {
    return { total: 0, totalPages: 1 };
  }

  const totalKeys = ["total", "totalItems", "total_items", "totalCount"];
  const pageKeys = ["totalPages", "total_pages", "totalpages", "pages"];

  let total = 0;
  for (const key of totalKeys) {
    if (meta[key] !== undefined) {
      total = normalizeNonNegativeInteger(meta[key], total);
    }
  }

  let totalPages = 1;
  for (const key of pageKeys) {
    if (meta[key] !== undefined) {
      totalPages = resolvePositiveInteger(meta[key], totalPages);
    }
  }

  return { total, totalPages };
};

const formatPrice = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "—";
  }
  if (numeric === 0) {
    return "Free";
  }
  return `$${numeric.toFixed(2)}`;
};

export default function AdminClassesTable() {
  const { t } = useTranslation("dashboard");
  const { user, hasHydrated } = useAuthStore((state) => ({
    user: state.user,
    hasHydrated: state.hasHydrated,
  }));
  const refreshNotifications = useNotificationStore((state) => state.fetch);
  const refreshMessages = useMessageStore((state) => state.fetch);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterApproval, setFilterApproval] = useState("All");
  const [sortKey, setSortKey] = useState("start_date");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizeSetting, setPageSizeSetting] = useState(String(DEFAULT_PAGE_SIZE));
  const [classList, setClassList] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [remoteTotalPages, setRemoteTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const lastFetchKeyRef = useRef(null);
  const errorToastShownRef = useRef(false);

  const translate = useCallback(
    (key, fallback) => {
      const value = t(key, { defaultValue: fallback });
      return value === key ? fallback : value;
    },
    [t]
  );

  const scheduleFilterActive = shouldApplyScheduleFilter(filterStatus);

  const sortedClasses = useMemo(() => {
    const list = Array.isArray(classList) ? [...classList] : [];
    list.sort((a, b) => compareValues(a, b, sortKey));
    if (sortDirection === "desc") {
      list.reverse();
    }
    return list;
  }, [classList, sortKey, sortDirection]);

  const displayedClasses = sortedClasses;

  const totalPages = useMemo(() => {
    if (scheduleFilterActive || pageSizeSetting === "all") {
      return 1;
    }

    return Math.max(1, remoteTotalPages);
  }, [scheduleFilterActive, pageSizeSetting, remoteTotalPages]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const loadClasses = useCallback(
    async ({ force = false, page: overridePage } = {}) => {
      if (!hasHydrated) {
        return;
      }

      if (!user?.id) {
        setClassList([]);
        setTotalItems(0);
        setAuthError(false);
        lastFetchKeyRef.current = null;
        return;
      }

      if (force) {
        lastFetchKeyRef.current = null;
      }

      const trimmedSearch = searchTerm.trim();
      const statusQuery = mapStatusFilterToQuery(filterStatus);
      const applySchedule = shouldApplyScheduleFilter(filterStatus);
      const previousTotal = totalItems;
      const limitFallback =
        pageSizeSetting === "all"
          ? previousTotal > 0
            ? previousTotal
            : DEFAULT_PAGE_SIZE
          : resolvePositiveInteger(pageSizeSetting, DEFAULT_PAGE_SIZE);
      const targetPage = applySchedule ? 1 : overridePage ?? currentPage;

      const baseParams = {
        page: targetPage,
        limit: limitFallback,
        ...(trimmedSearch ? { filter: trimmedSearch } : {}),
        ...(statusQuery ? { status: statusQuery } : {}),
        ...(filterApproval !== "All" ? { approval: filterApproval } : {}),
      };

      const fetchKey = JSON.stringify({
        ...baseParams,
        schedule: filterStatus,
        pageSize: pageSizeSetting,
      });

      if (!force && lastFetchKeyRef.current === fetchKey) {
        return;
      }

      lastFetchKeyRef.current = fetchKey;
      setLoading(true);
      setAuthError(false);

      try {
        let aggregated = [];
        let metaInfo = { total: 0, totalPages: 1 };

        const firstResponse = await fetchAdminClasses(baseParams);
        aggregated = sanitizeClassList(firstResponse?.data);
        metaInfo = parseMeta(firstResponse?.meta);

        if (applySchedule) {
          const totalPagesFromMeta = metaInfo.totalPages;
          if (totalPagesFromMeta > 1) {
            const additionalPages = await Promise.all(
              Array.from({ length: totalPagesFromMeta - 1 }, (_, index) =>
                fetchAdminClasses({ ...baseParams, page: index + 2 }).then((response) =>
                  sanitizeClassList(response?.data)
                )
              )
            );
            additionalPages.forEach((list) => {
              aggregated = aggregated.concat(list);
            });
          }

          aggregated = aggregated.filter(
            (item) => deriveScheduleStatus(item) === normalizeStatusValue(filterStatus)
          );

          metaInfo = {
            total: aggregated.length,
            totalPages: 1,
          };
        } else if (pageSizeSetting === "all") {
          metaInfo.totalPages = 1;
        }

        const normalizedRecords = aggregated
          .map((item) => normalizeClassRecord(item))
          .filter(Boolean);

        const totalForState = metaInfo.total || normalizedRecords.length;
        const computedTotalPages =
          pageSizeSetting === "all" || applySchedule
            ? 1
            : Math.max(
                1,
                metaInfo.totalPages ||
                  Math.ceil(
                    Math.max(totalForState, normalizedRecords.length || 1) /
                      limitFallback
                  )
              );

        setClassList(normalizedRecords);
        setTotalItems(totalForState);
        setRemoteTotalPages(computedTotalPages);
        errorToastShownRef.current = false;
      } catch (error) {
        console.error("Failed to load classes", error);
        if (error?.response?.status === 403) {
          setAuthError(true);
        }
        if (!errorToastShownRef.current) {
          toast.error("Failed to load classes");
          errorToastShownRef.current = true;
        }
      } finally {
        setLoading(false);
      }
    },
    [
      hasHydrated,
      user?.id,
      searchTerm,
      filterStatus,
      filterApproval,
      pageSizeSetting,
      currentPage,
      totalItems,
    ]
  );

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleSort = (key) => {
    setSortKey((previousKey) => {
      if (previousKey === key) {
        setSortDirection((prevDirection) => (prevDirection === "asc" ? "desc" : "asc"));
        return previousKey;
      }
      setSortDirection("asc");
      return key;
    });
  };

  const openDeleteDialog = (cls) => {
    setPendingDelete(cls);
  };

  const closeDeleteDialog = () => {
    setPendingDelete(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) {
      return;
    }

    try {
      await deleteAdminClass(pendingDelete.id);
      toast.success("Class deleted");
      refreshNotifications();
      refreshMessages();

      const shouldGoBackOnePage =
        pageSizeSetting !== "all" && currentPage > 1 && displayedClasses.length <= 1;
      const nextPage = shouldGoBackOnePage ? currentPage - 1 : currentPage;

      setPendingDelete(null);
      setCurrentPage(nextPage);
      await loadClasses({ force: true, page: nextPage });
    } catch (error) {
      console.error("Failed to delete class", error);
      toast.error("Unable to delete class");
    }
  };

  const handleApprove = async (classId) => {
    try {
      await approveAdminClass(classId);
      toast.success("Class approved");
      refreshNotifications();
      refreshMessages();
      await loadClasses({ force: true });
    } catch (error) {
      console.error("Failed to approve class", error);
      toast.error("Unable to approve class");
    }
  };

  const handleReject = async (classId) => {
    const reason = typeof window !== "undefined" ? window.prompt("Enter a rejection reason") : null;
    if (!reason || reason.trim().length < MIN_REJECTION_REASON_LENGTH) {
      toast.error("Please provide a valid rejection reason");
      return;
    }

    try {
      await rejectAdminClass(classId, reason.trim());
      toast.success("Class rejected");
      refreshNotifications();
      refreshMessages();
      await loadClasses({ force: true });
    } catch (error) {
      console.error("Failed to reject class", error);
      toast.error("Unable to reject class");
    }
  };

  const handleToggleStatus = async (classId) => {
    try {
      await toggleClassStatus(classId);
      toast.success("Class status updated");
      await loadClasses({ force: true });
    } catch (error) {
      console.error("Failed to toggle class status", error);
      toast.error("Unable to update class status");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder={translate("search_classes_placeholder", "Search classes...")}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 w-72"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600" htmlFor="status-filter">
              {translate("status", "Status")}
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(event) => {
                setFilterStatus(event.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600" htmlFor="approval-filter">
              {translate("approval", "Approval")}
            </label>
            <select
              id="approval-filter"
              value={filterApproval}
              onChange={(event) => {
                setFilterApproval(event.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              {APPROVAL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600" htmlFor="page-size">
              {translate("per_page", "Per page")}
            </label>
            <select
              id="page-size"
              value={pageSizeSetting}
              onChange={(event) => {
                setPageSizeSetting(event.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? translate("all", "All") : option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FaList className="text-yellow-500" />
          <span>
            {translate("total_items", "Total")}: {totalItems}
          </span>
        </div>
      </div>

      {authError ? (
        <div className="p-6 text-center text-sm text-red-600">
          {translate(
            "admin_classes_auth_error",
            "Unable to load classes. Please check your permissions."
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { key: "title", label: translate("class_title", "Class") },
                  { key: "instructor", label: translate("instructor", "Instructor") },
                  { key: "start_date", label: translate("start_date", "Start") },
                  { key: "end_date", label: translate("end_date", "End") },
                  { key: "category", label: translate("category", "Category") },
                  { key: "price", label: translate("price", "Price") },
                  { key: "publishStatus", label: translate("status", "Status") },
                  { key: "approvalStatus", label: translate("approval", "Approval") },
                  { key: "scheduleStatus", label: translate("schedule", "Schedule") },
                ].map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {sortKey === column.key && (
                        <span className="text-gray-400 text-[10px]">
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translate("actions", "Actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-sm text-gray-500">
                  {translate("loading", "Loading...")}
                </td>
              </tr>
            )}

            {!loading && displayedClasses.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-sm text-gray-500">
                  {translate("no_classes_found", "No classes found.")}
                </td>
              </tr>
            )}

              {!loading &&
                displayedClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-yellow-500" />
                        <span>{cls.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{cls.instructor || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{cls.start_date || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{cls.end_date || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{cls.category || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatPrice(cls.price)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                      {cls.publishStatus || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                      {cls.approvalStatus || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                      {cls.scheduleStatus || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/admin/online-classes/${cls.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                          title="View Class"
                        >
                          <FaList />
                        </Link>
                        <Link
                          href={`/dashboard/admin/online-classes/${cls.id}/students`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                          title="View Students"
                        >
                          <FaUserGraduate />
                        </Link>
                        <Link
                          href={`/dashboard/admin/online-classes/${cls.id}/analytics`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200"
                          title="View Analytics"
                        >
                          <FaChartBar />
                        </Link>
                        <Link
                          href={`/dashboard/admin/online-classes/edit/${cls.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                          title="Edit Class"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cls.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                          title="Toggle Publish Status"
                        >
                          {cls.publishStatus === "published" ? <FaPause /> : <FaPlay />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(cls.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                          title="Approve Class"
                        >
                          <FaCheck />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(cls.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                          title="Reject Class"
                        >
                          <FaTimes />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteDialog(cls)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                          title="Delete Class"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {translate("showing_of", "Showing")} {displayedClasses.length} {translate("of", "of")} {totalItems}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            <FaChevronLeft className="mr-1" />
            {translate("previous", "Previous")}
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-full text-sm font-medium border ${
                  currentPage === page
                    ? "bg-yellow-500 text-white border-yellow-500"
                    : "border-gray-300 text-gray-700 hover:border-yellow-500"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            {translate("next", "Next")}
            <FaChevronRight className="ml-1" />
          </button>
        </div>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {translate("confirm_delete_title", "Delete class")}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {translate(
                "confirm_delete_message",
                "Are you sure you want to delete this class?"
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteDialog}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                {translate("cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
