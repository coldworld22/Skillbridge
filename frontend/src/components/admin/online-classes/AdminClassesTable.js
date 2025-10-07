import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  approveAdminClass,
  deleteAdminClass,
  fetchAdminClasses,
  rejectAdminClass,
  toggleClassStatus,
} from "@/services/admin/classService";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaChartBar,
  FaCheck,
  FaDownload,
  FaEdit,
  FaList,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaTrash,
  FaUserGraduate,
} from "react-icons/fa";
import useDebounce from "@/hooks/useDebounce";

const DEFAULT_PAGE_SIZE = 5;
const FAILED_REQUEST_RETRY_DELAY_MS = 5000;
const MIN_REJECTION_REASON_LENGTH = 3;
const MAX_PAGINATION_BUTTONS = 100;

const SCHEDULE_FILTER_OPTIONS = ["All", "Upcoming", "Ongoing", "Completed"];
const APPROVAL_FILTER_OPTIONS = ["All", "Approved", "Pending", "Rejected"];

const sanitizeClassEntries = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => item && typeof item === "object");
};

const resolvePositiveInteger = (value, fallback = DEFAULT_PAGE_SIZE) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.floor(numeric);
  }

  const fallbackNumeric = Number(fallback);
  if (Number.isFinite(fallbackNumeric) && fallbackNumeric > 0) {
    return Math.floor(fallbackNumeric);
  }

  return DEFAULT_PAGE_SIZE;
};

const compareValues = (a, b, key) => {
  const valueA = a?.[key];
  const valueB = b?.[key];

  if (valueA === valueB) {
    return 0;
  }

  if (key === "start_date" || key === "end_date") {
    const timeA = valueA ? Date.parse(valueA) : NaN;
    const timeB = valueB ? Date.parse(valueB) : NaN;
    if (Number.isFinite(timeA) && Number.isFinite(timeB)) {
      return timeA - timeB;
    }
  }

  if (typeof valueA === "number" && typeof valueB === "number") {
    return valueA - valueB;
  }

  const stringA = valueA == null ? "" : String(valueA);
  const stringB = valueB == null ? "" : String(valueB);
  return stringA.localeCompare(stringB);
};

const sortClasses = (items, key) => {
  const safeItems = sanitizeClassEntries(items);
  if (!safeItems.length) {
    return [];
  }

  return [...safeItems].sort((a, b) => compareValues(a, b, key));
};

const mapScheduleFilterToParam = (value) => {
  if (!value || value === "All") {
    return undefined;
  }

  return String(value).toLowerCase();
};

const normalizeTotalPages = (value) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 1;
  }

  if (numeric > Number.MAX_SAFE_INTEGER) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Math.ceil(numeric);
};

const extractInstructorId = (cls) => {
  if (!cls || typeof cls !== "object") {
    return null;
  }

  if (cls.instructor_id != null) {
    return cls.instructor_id;
  }

  if (cls.instructorId != null) {
    return cls.instructorId;
  }

  if (cls.instructor && typeof cls.instructor === "object") {
    if (cls.instructor.id != null) {
      return cls.instructor.id;
    }
    if (cls.instructor.user_id != null) {
      return cls.instructor.user_id;
    }
  }

  return null;
};

const formatCurrency = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "$0.00";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(numeric);
};

const downloadCSV = (rows, headers) => {
  if (typeof window === "undefined") {
    return;
  }

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          if (cell == null) {
            return "";
          }
          const normalized = String(cell).replace(/"/g, '""');
          return `"${normalized}"`;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "online-classes.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [filterSchedule, setFilterSchedule] = useState("All");
  const [filterApproval, setFilterApproval] = useState("All");
  const [sortKey, setSortKey] = useState("start_date");
  const [classList, setClassList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizeSetting, setPageSizeSetting] = useState(String(DEFAULT_PAGE_SIZE));
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [modalClass, setModalClass] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const retryTimeoutRef = useRef(null);
  const [retryToken, setRetryToken] = useState(0);
  const skipNextFetchRef = useRef(false);

  const translate = (key, defaultValue) => {
    const translated = t(key, { defaultValue });
    if (translated === key) {
      return defaultValue ?? key;
    }
    return translated;
  };

  const normalizedItemsPerPage = useMemo(() => {
    if (pageSizeSetting === "all") {
      return classList.length || totalItems || DEFAULT_PAGE_SIZE;
    }

    return resolvePositiveInteger(pageSizeSetting, DEFAULT_PAGE_SIZE);
  }, [pageSizeSetting, classList.length, totalItems]);

  const canManageRules = useMemo(() => {
    if (!user || !Array.isArray(user.permissions)) {
      return false;
    }

    return user.permissions.includes("ADD_ONLINE_CLASS_RULE");
  }, [user]);

  const totalPagesNormalized = useMemo(
    () => normalizeTotalPages(totalPages),
    [totalPages]
  );

  const paginationButtonCount = useMemo(() => {
    return Math.min(totalPagesNormalized, MAX_PAGINATION_BUTTONS);
  }, [totalPagesNormalized]);

  const isPaginationTruncated = totalPagesNormalized > MAX_PAGINATION_BUTTONS;

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (pageSizeSetting === "all" && currentPage !== 1) {
      skipNextFetchRef.current = true;
      setCurrentPage(1);
    }
  }, [pageSizeSetting, currentPage]);

  useEffect(() => {
    if (currentPage > totalPagesNormalized) {
      setCurrentPage(totalPagesNormalized);
    }
  }, [currentPage, totalPagesNormalized]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!user?.id) {
      setClassList([]);
      setTotalItems(0);
      setTotalPages(1);
      setAuthError(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchClasses = async () => {
      if (skipNextFetchRef.current) {
        skipNextFetchRef.current = false;
        return;
      }

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      setLoading(true);
      setAuthError(false);
      setFetchError(null);

      const scheduleParam = mapScheduleFilterToParam(filterSchedule);
      const approvalParam = filterApproval !== "All" ? filterApproval : undefined;
      const sanitizedSearch = debouncedSearch.trim();
      const perPage =
        pageSizeSetting === "all"
          ? DEFAULT_PAGE_SIZE
          : resolvePositiveInteger(pageSizeSetting, DEFAULT_PAGE_SIZE);
      const requestedPage = pageSizeSetting === "all" ? 1 : currentPage;

      try {
        const baseParams = {
          page: requestedPage,
          limit: perPage,
          filter: sanitizedSearch || undefined,
          approval: approvalParam,
          schedule: scheduleParam,
        };

        const { data, meta } = await fetchAdminClasses(baseParams);
        let aggregated = sanitizeClassEntries(data);
        let totalFromMeta = Number(
          meta?.total ??
            meta?.totalItems ??
            meta?.total_items ??
            meta?.totalCount ??
            aggregated.length
        );
        let totalPagesFromMeta = Number(
          meta?.totalPages ??
            meta?.total_pages ??
            (perPage > 0 ? Math.ceil(totalFromMeta / perPage) : 1)
        );
        if (!Number.isFinite(totalPagesFromMeta) || totalPagesFromMeta <= 0) {
          totalPagesFromMeta = 1;
        }

        if (pageSizeSetting === "all" && Number.isFinite(totalPagesFromMeta) && totalPagesFromMeta > 1) {
          const additionalPages = [];
          for (let page = 2; page <= totalPagesFromMeta; page += 1) {
            additionalPages.push(
              fetchAdminClasses({ ...baseParams, page, limit: perPage }).then((response) =>
                sanitizeClassEntries(response.data)
              )
            );
          }

          const results = await Promise.all(additionalPages);
          aggregated = aggregated.concat(...results);
          totalFromMeta = aggregated.length;
          totalPagesFromMeta = 1;
        }

        const sorted = sortClasses(aggregated, sortKey);

        if (cancelled) {
          return;
        }

        setClassList(sorted);
        setTotalItems(totalFromMeta);

        if (pageSizeSetting === "all") {
          setTotalPages(1);
          if (currentPage !== 1) {
            skipNextFetchRef.current = true;
            setCurrentPage(1);
          }
        } else {
          const safeTotalPages = Number.isFinite(totalPagesFromMeta)
            ? Math.max(1, totalPagesFromMeta)
            : Math.max(1, Math.ceil(totalFromMeta / perPage));
          const normalizedTotalPages = normalizeTotalPages(safeTotalPages);
          setTotalPages(normalizedTotalPages);
          if (requestedPage > normalizedTotalPages) {
            skipNextFetchRef.current = true;
            setCurrentPage(normalizedTotalPages);
          }
        }

        setAuthError(false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const statusCode =
          error?.response?.status ?? error?.status ?? error?.statusCode ?? null;

        if (statusCode === 401 || statusCode === 403) {
          setAuthError(true);
          setClassList([]);
          setTotalItems(0);
          setTotalPages(1);
          setFetchError(null);
        } else {
          console.error(error);
          const message = translate(
            "admin_classes_fetch_error",
            "We were unable to load classes. Please try again."
          );
          toast.error(message);
          setFetchError(message);
          if (!retryTimeoutRef.current) {
            retryTimeoutRef.current = setTimeout(() => {
              retryTimeoutRef.current = null;
              setRetryToken((token) => token + 1);
            }, FAILED_REQUEST_RETRY_DELAY_MS);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchClasses();

    return () => {
      cancelled = true;
    };
  }, [
    hasHydrated,
    user?.id,
    debouncedSearch,
    filterSchedule,
    filterApproval,
    sortKey,
    currentPage,
    pageSizeSetting,
    retryToken,
  ]);

  const handleStatusChange = async (id, action, reason = "") => {
    const target = classList.find((cls) => cls.id === id);
    if (!target) {
      return;
    }

    try {
      if (action === "approve") {
        const updated = await approveAdminClass(id);
        setClassList((prev) =>
          prev.map((cls) =>
            cls.id === id ? { ...cls, ...updated, approvalStatus: "Approved" } : cls
          )
        );
        toast.success("Class approved");
        const instructorId = extractInstructorId(target);
        const title = target.title || "";
        if (instructorId && instructorId !== user?.id) {
          const message = `Your class ${title} was approved.`;
          await Promise.all([
            createNotification({
              user_id: instructorId,
              type: "class_approved",
              message,
            }).catch((err) => console.error(err)),
            sendChatMessage(instructorId, { text: message }).catch((err) =>
              console.error(err)
            ),
          ]);
        }
        refreshNotifications?.();
        refreshMessages?.();
      } else if (action === "reject") {
        await rejectAdminClass(id, reason);
        setClassList((prev) =>
          prev.map((cls) =>
            cls.id === id ? { ...cls, approvalStatus: "Rejected" } : cls
          )
        );
        toast.success("Class rejected");
        const instructorId = extractInstructorId(target);
        const title = target.title || "";
        if (instructorId && instructorId !== user?.id) {
          const message = `Your class ${title} was rejected. Reason: ${reason}`;
          await Promise.all([
            createNotification({
              user_id: instructorId,
              type: "class_rejected",
              message,
            }).catch((err) => console.error(err)),
            sendChatMessage(instructorId, { text: message }).catch((err) =>
              console.error(err)
            ),
          ]);
        }
        refreshNotifications?.();
        refreshMessages?.();
      } else if (action === "toggle") {
        const updated = await toggleClassStatus(id);
        if (updated) {
          setClassList((prev) =>
            prev.map((cls) => (cls.id === id ? { ...cls, ...updated } : cls))
          );
        }
        toast.success("Status updated");
      }
    } catch (error) {
      console.error(error);
      const errorMessage =
        error?.response?.data?.message || error?.message || "Failed to update class";
      toast.error(errorMessage);
    } finally {
      setModalClass(null);
    }
  };

  const handleDeleteClass = async (id) => {
    try {
      await deleteAdminClass(id);
      setClassList((prev) => prev.filter((cls) => cls.id !== id));
      setTotalItems((prev) => Math.max(prev - 1, 0));
      if (pageSizeSetting === "all") {
        setTotalPages(1);
        setCurrentPage(1);
      } else {
        setTotalPages((prev) => {
          const nextTotal = Math.max(totalItems - 1, 0);
          const pageSize = resolvePositiveInteger(pageSizeSetting, DEFAULT_PAGE_SIZE);
          return normalizeTotalPages(Math.max(1, Math.ceil(nextTotal / pageSize)));
        });
        setCurrentPage((prevPage) => {
          const pageSize = resolvePositiveInteger(pageSizeSetting, DEFAULT_PAGE_SIZE);
          const nextTotal = Math.max(totalItems - 1, 0);
          const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize));
          return Math.min(prevPage, normalizeTotalPages(nextTotalPages));
        });
      }
      toast.success("Class deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete class");
    } finally {
      setModalClass(null);
    }
  };

  const handleExport = async () => {
    if (!classList.length) {
      toast.error("No classes available to export");
      return;
    }

    setExporting(true);
    try {
      const headers = [
        "Title",
        "Instructor",
        "Start Date",
        "End Date",
        "Category",
        "Price",
        "Schedule Status",
        "Publish Status",
        "Approval Status",
      ];
      const rows = classList.map((cls) => [
        cls.title || "",
        cls.instructor || "",
        cls.start_date || "",
        cls.end_date || "",
        cls.category || "",
        formatCurrency(cls.price),
        cls.scheduleStatus || "",
        cls.publishStatus || "",
        cls.approvalStatus || "",
      ]);
      downloadCSV(rows, headers);
    } finally {
      setExporting(false);
    }
  };

  const trimmedRejectionReason = rejectionReason.trim();
  const isRejectionReasonValid =
    trimmedRejectionReason.length >= MIN_REJECTION_REASON_LENGTH;

  const handleModalConfirm = () => {
    if (!modalClass) {
      return;
    }

    if (modalType === "reject") {
      if (!isRejectionReasonValid) {
        toast.error("Please provide a rejection reason");
        return;
      }
      handleStatusChange(modalClass.id, "reject", trimmedRejectionReason);
      return;
    }

    if (modalType === "delete") {
      handleDeleteClass(modalClass.id);
    }
  };

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPagesNormalized));
  };

  const handleRetryNow = () => {
    setRetryToken((token) => token + 1);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterSchedule("All");
    setFilterApproval("All");
    setSortKey("start_date");
    setPageSizeSetting(String(DEFAULT_PAGE_SIZE));
    setCurrentPage(1);
    setFetchError(null);
    setRetryToken((token) => token + 1);
  };

  if (authError) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 text-center">
        {translate(
          "admin_classes_auth_error",
          "Unable to load classes. Please sign in again to continue."
        )}
      </div>
    );
  }

  if (loading && !classList.length) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 text-center">
        {translate("loading_classes", "Loading classes...")}
      </div>
    );
  }

  if (fetchError && !loading && !classList.length) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 text-center space-y-4">
        <p className="text-gray-600">{fetchError}</p>
        <button
          type="button"
          onClick={handleRetryNow}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-yellow-500 rounded-xl shadow hover:bg-yellow-600"
        >
          <FaSyncAlt className="w-4 h-4" />
          {translate("retry_loading_classes", "Try again")}
        </button>
      </div>
    );
  }

  if (!loading && !classList.length) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
          <FaList className="h-5 w-5" />
        </div>
        <p className="text-gray-700 font-semibold">
          {translate(
            "admin_classes_empty_state_title",
            "No classes match your current filters"
          )}
        </p>
        <p className="text-gray-500">
          {translate(
            "admin_classes_empty_state_message",
            "Adjust your filters or create a new class to get started."
          )}
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm font-semibold text-yellow-600 bg-yellow-100 rounded-xl hover:bg-yellow-200"
          >
            {translate("reset_filters_button", "Reset filters")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-1/2">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder={translate(
              "search_classes_placeholder",
              "Search by title or instructor"
            )}
            className="border border-gray-300 rounded-xl px-4 py-2 w-full text-sm focus:ring-2 focus:ring-yellow-500"
            value={searchTerm}
            aria-label={translate(
              "search_classes_placeholder",
              "Search by title or instructor"
            )}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-1/2 justify-end items-center flex-wrap">
          <select
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm"
            value={filterSchedule}
            onChange={(event) => {
              setFilterSchedule(event.target.value);
              setCurrentPage(1);
            }}
          >
            {SCHEDULE_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "All"
                  ? translate("all_schedule_option", "All Schedule")
                  : option}
              </option>
            ))}
          </select>
          <select
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm"
            value={filterApproval}
            onChange={(event) => {
              setFilterApproval(event.target.value);
              setCurrentPage(1);
            }}
          >
            {APPROVAL_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "All"
                  ? translate("all_approval_option", "All Approval")
                  : option}
              </option>
            ))}
          </select>
          <select
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm"
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value)}
          >
            <option value="start_date">{translate("sort_by_start_date", "Sort by Start Date")}</option>
            <option value="title">{translate("sort_by_title", "Sort by Title")}</option>
            <option value="instructor">{translate("sort_by_instructor", "Sort by Instructor")}</option>
          </select>
          <select
            value={pageSizeSetting}
            onChange={(event) => {
              const { value } = event.target;
              if (value === "all") {
                setPageSizeSetting("all");
              } else {
                const sanitizedValue = resolvePositiveInteger(
                  value,
                  DEFAULT_PAGE_SIZE
                );
                setPageSizeSetting(String(sanitizedValue));
              }
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="all">All</option>
          </select>
          <button
            onClick={handleExport}
            className={`flex items-center gap-2 text-sm text-white rounded-xl px-4 py-2 ${
              exporting
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
            title={
              exporting
                ? translate("export_in_progress", "Export in progress")
                : translate(
                    "export_filtered_classes",
                    "Export all filtered classes to CSV"
                  )
            }
            disabled={exporting}
          >
            <FaDownload />
            {exporting
              ? translate("exporting_label", "Exporting...")
              : translate("export_button_label", "Export")}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 text-sm uppercase">
            <tr>
              <th className="px-6 py-3 text-left">{translate("image_header", "Image")}</th>
              <th className="px-6 py-3 text-left">{translate("title_header", "Title")}</th>
              <th className="px-6 py-3 text-left">{translate("instructor_header", "Instructor")}</th>
              <th className="px-6 py-3 text-left">{translate("start_date_header", "Start Date")}</th>
              <th className="px-6 py-3 text-left">{translate("end_date_header", "End Date")}</th>
              <th className="px-6 py-3 text-left">{translate("category_header", "Category")}</th>
              <th className="px-6 py-3 text-left">{translate("price_header", "Price")}</th>
              <th className="px-6 py-3 text-left">{translate("schedule_header", "Schedule")}</th>
              <th className="px-6 py-3 text-left">{translate("publish_header", "Publish")}</th>
              <th className="px-6 py-3 text-left">{translate("approval_header", "Approval")}</th>
              <th className="px-6 py-3 text-right">{translate("actions_header", "Actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {classList.map((cls) => (
              <tr key={cls.id} className="hover:bg-yellow-50">
                <td className="px-6 py-4">
                  {cls.cover_image ? (
                    <img
                      src={cls.cover_image}
                      alt={cls.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded" />
                  )}
                </td>
                <td className="px-6 py-4 font-semibold">{cls.title}</td>
                <td className="px-6 py-4">{cls.instructor}</td>
                <td className="px-6 py-4">{cls.start_date}</td>
                <td className="px-6 py-4">{cls.end_date || "-"}</td>
                <td className="px-6 py-4">{cls.category || "-"}</td>
                <td className="px-6 py-4">
                  {cls.price > 0
                    ? formatCurrency(cls.price)
                    : translate("free_label", "Free")}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      {
                        Upcoming: "bg-green-100 text-green-800",
                        Ongoing: "bg-blue-100 text-blue-800",
                        Completed: "bg-gray-300 text-gray-800",
                      }[cls.scheduleStatus] || "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {cls.scheduleStatus}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleStatusChange(cls.id, "toggle")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      cls.publishStatus === "published"
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    }`}
                  >
                    {cls.publishStatus === "published"
                      ? translate("published_label", "Published")
                      : translate("draft_label", "Draft")}
                  </button>
                </td>
                <td className="px-6 py-4">
                  {cls.approvalStatus === "Pending" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(cls.id, "approve")}
                        className="bg-green-100 hover:bg-green-200 text-green-700 text-xs px-3 py-1 rounded-full"
                      >
                        {translate("approve_button", "Approve")}
                      </button>
                      <button
                        onClick={() => {
                          setModalClass(cls);
                          setModalType("reject");
                          setRejectionReason("");
                        }}
                        className="bg-red-100 hover:bg-red-200 text-red-700 text-xs px-3 py-1 rounded-full"
                      >
                        {translate("reject_button", "Reject")}
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        {
                          Approved: "bg-green-100 text-green-800",
                          Rejected: "bg-red-100 text-red-700",
                        }[cls.approvalStatus] || "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {cls.approvalStatus}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-1 space-y-1">
                  <button
                    title={translate("approve_button", "Approve Class")}
                    onClick={() => handleStatusChange(cls.id, "approve")}
                    className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded shadow"
                  >
                    <FaCheck className="w-4 h-4" />
                  </button>
                  <button
                    title={translate("reject_button", "Reject Class")}
                    onClick={() => {
                      setModalClass(cls);
                      setModalType("reject");
                      setRejectionReason("");
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded shadow"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/dashboard/admin/online-classes/edit/${cls.id}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded shadow"
                    title={translate("manage_class_tooltip", "Manage Class")}
                  >
                    <FaEdit className="w-4 h-4" />
                  </Link>
                  {canManageRules && (
                    <Link
                      href={`/dashboard/admin/online-classes/${cls.id}/rules`}
                      className="bg-teal-500 hover:bg-teal-600 text-white text-xs px-2 py-1 rounded shadow"
                      title={translate("manage_rules_tooltip", "Manage Rules")}
                    >
                      <FaList className="w-4 h-4" />
                    </Link>
                  )}
                  <button
                    title={translate("delete_class_tooltip", "Delete Class")}
                    onClick={() => {
                      setModalClass(cls);
                      setModalType("delete");
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded shadow"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/dashboard/admin/online-classes/${cls.id}/students`}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow"
                    title={translate(
                      "view_students_tooltip",
                      "View Enrolled Students"
                    )}
                  >
                    <FaUserGraduate className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/dashboard/admin/online-classes/${cls.id}`}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2 py-1 rounded shadow"
                    title={translate(
                      "view_class_details_tooltip",
                      "View Class Details"
                    )}
                  >
                    <FaCalendarAlt className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/dashboard/admin/online-classes/${cls.id}/analytics`}
                    title={translate("view_analytics_tooltip", "View Analytics")}
                    className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-2 py-1 rounded shadow"
                  >
                    <FaChartBar className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPagesNormalized > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            {translate("pagination_summary", "Showing")} {(currentPage - 1) * normalizedItemsPerPage + 1}
            –{Math.min(currentPage * normalizedItemsPerPage, totalItems)} {translate("pagination_of", "of")} {totalItems} {translate("pagination_classes", "classes")}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="text-sm px-3 py-1 bg-gray-200 hover:bg-yellow-100 rounded disabled:opacity-50"
            >
              <FaChevronLeft />
            </button>
            {Array.from({ length: paginationButtonCount }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`text-sm px-3 py-1 rounded ${
                  currentPage === index + 1
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-100 hover:bg-yellow-100"
                }`}
              >
                {index + 1}
              </button>
            ))}
            {isPaginationTruncated && (
              <>
                <span className="px-2 text-sm text-gray-500">…</span>
                <button
                  onClick={() => setCurrentPage(totalPagesNormalized)}
                  className={`text-sm px-3 py-1 rounded ${
                    currentPage === totalPagesNormalized
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-100 hover:bg-yellow-100"
                  }`}
                >
                  {totalPagesNormalized}
                </button>
              </>
            )}
            <button
              onClick={handleNext}
              disabled={currentPage === totalPagesNormalized}
              className="text-sm px-3 py-1 bg-gray-200 hover:bg-yellow-100 rounded disabled:opacity-50"
            >
              <FaChevronRight />
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPagesNormalized, prev + 1))
            }
            disabled={currentPage >= totalPagesNormalized}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            {translate("next", "Next")}
            <FaChevronRight className="ml-1" />
          </button>
        </div>
      )}

      {modalClass && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl text-center max-w-md w-full">
            <h2 className="text-xl font-bold mb-2">
              {modalType === "reject"
                ? translate("confirm_rejection_title", "Confirm Rejection")
                : translate("confirm_deletion_title", "Confirm Deletion")}
            </h2>
            <p className="mb-4 text-gray-600">
              {translate("confirm_action_prompt", "Are you sure you want to proceed?")}
              <br />
              <strong>{modalClass.title}</strong>
            </p>
            {modalType === "reject" && (
              <textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
                placeholder={translate("rejection_reason_placeholder", "Enter rejection reason")}
              />
            )}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setModalClass(null)}
                className="bg-gray-200 px-4 py-2 rounded"
              >
                {translate("cancel_button", "Cancel")}
              </button>
              <button
                onClick={handleModalConfirm}
                disabled={modalType === "reject" && !isRejectionReasonValid}
                className={`px-4 py-2 rounded text-white ${
                  modalType === "reject" ? "bg-red-600" : "bg-gray-800"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {modalType === "reject"
                  ? translate("confirm_reject_button", "Yes, Reject")
                  : translate("confirm_delete_button", "Yes, Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
