// ✅ AdminClassesTable.js with Full Routing, Labeled Buttons, and Tooltips
import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  deleteAdminClass,
  approveAdminClass,
  rejectAdminClass,
  toggleClassStatus,
  fetchAdminClasses,
} from "@/services/admin/classService";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import {
  FaCalendarAlt,
  FaSearch,
  FaDownload,
  FaUserGraduate,
  FaChartBar,
  FaCheck,
  FaTimes,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaList
} from "react-icons/fa";

const BACKEND_STATUSES = new Set(["draft", "published", "archived"]);
const MIN_REJECTION_REASON_LENGTH = 3;

export const FAILED_SIGNATURE_RETRY_DELAY_MS = 5000;

const DEFAULT_PAGE_SIZE = 5;
const FAILED_REQUEST_RETRY_DELAY_MS = 5000;
const resolvePositiveInteger = (value, fallback = 1) => {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return Math.floor(numericValue);
  }

  const fallbackValue = Number(fallback);
  if (Number.isFinite(fallbackValue) && fallbackValue > 0) {
    return Math.floor(fallbackValue);
  }

  return 1;
};

export const mapStatusFilterToQuery = (filterStatus) => {
  if (!filterStatus || filterStatus === "All") {
    return undefined;
  }

  const normalized = filterStatus.toLowerCase();
  return BACKEND_STATUSES.has(normalized) ? normalized : undefined;
};

const shouldApplyScheduleFilter = (filterStatus) => {
  if (!filterStatus || filterStatus === "All") {
    return false;
  }

  return !BACKEND_STATUSES.has(filterStatus.toLowerCase());
};

export function compareValues(a, b, key) {
  const valA = a[key];
  const valB = b[key];

  if (valA === valB) return 0;

  const numA = typeof valA === 'number' ? valA : Date.parse(valA);
  const numB = typeof valB === 'number' ? valB : Date.parse(valB);

  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }

  if (typeof valA === 'string' && typeof valB === 'string') {
    return valA.localeCompare(valB);
  }

  return 0;
}

const computeListSignature = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  return items
    .map((item) => {
      if (item && typeof item === "object") {
        if ("id" in item) {
          return String(item.id);
        }
        if ("_id" in item) {
          return String(item._id);
        }
      }

      try {
        return JSON.stringify(item);
      } catch (err) {
        return String(item);
      }
    })
    .join("|");
};

const sanitizeClassEntries = (items) => {
  if (!Array.isArray(items)) {
    return null;
  }

  let encounteredInvalid = false;
  const sanitized = [];

  for (const item of items) {
    if (item && typeof item === "object") {
      sanitized.push(item);
    } else {
      encounteredInvalid = true;
    }
  }

  if (!encounteredInvalid) {
    return items;
  }

  return sanitized;
};

export default function AdminClassesTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterApproval, setFilterApproval] = useState("All");
  const [sortKey, setSortKey] = useState("start_date");
  const [classList, setClassList] = useState([]);
  const [modalClass, setModalClass] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizeSetting, setPageSizeSetting] = useState(String(DEFAULT_PAGE_SIZE));
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [isMounted, setMounted] = useState(false);
  const lastSuccessfulSignatureRef = useRef(null);
  const lastFailedSignatureRef = useRef(null);
  const inFlightRequestRef = useRef(null);
  const pendingRequestRef = useRef(null);
  const isComponentMountedRef = useRef(true);
  const authFailureRef = useRef(false);
  const lastNormalizedPageRef = useRef(currentPage);
  const currentPageRef = useRef(currentPage);
  const totalItemsRef = useRef(totalItems);
  const totalPagesRef = useRef(totalPages);
  const loadingRef = useRef(false);
  const classListLengthRef = useRef(0);
  const classListSignatureRef = useRef("");
  const { user, hasHydrated } = useAuthStore((state) => ({
    user: state.user,
    hasHydrated: state.hasHydrated,
  }));
  const authIdentifier = user?.id ?? null;
  const authIdentifierRef = useRef(authIdentifier);
  const { t } = useTranslation('dashboard');
  const refreshNotifications = useNotificationStore((state) => state.fetch);
  const refreshMessages = useMessageStore((state) => state.fetch);
  const normalizedItemsPerPage = useMemo(() => {
    if (pageSizeSetting === "all") {
      return resolvePositiveInteger(
        totalItemsRef.current,
        DEFAULT_PAGE_SIZE
      );
    }

    return resolvePositiveInteger(pageSizeSetting, DEFAULT_PAGE_SIZE);
  }, [pageSizeSetting]);

  const clearFailedSignature = (failureRecord = lastFailedSignatureRef.current) => {
    if (failureRecord?.retryTimer) {
      clearTimeout(failureRecord.retryTimer);
    }
    if (lastFailedSignatureRef.current === failureRecord) {
      lastFailedSignatureRef.current = null;
    }
  };

  useEffect(() => {
    setMounted(true);
    isComponentMountedRef.current = true;
    return () => {
      isComponentMountedRef.current = false;
      clearFailedSignature();
    };
  }, []);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    totalItemsRef.current = totalItems;
  }, [totalItems]);

  useEffect(() => {
    totalPagesRef.current = totalPages;
  }, [totalPages]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    authIdentifierRef.current = authIdentifier;
  }, [authIdentifier]);

  useEffect(() => {
    classListLengthRef.current = Array.isArray(classList)
      ? classList.length
      : 0;
    classListSignatureRef.current = computeListSignature(classList);
  }, [classList]);

  const setCurrentPageIfNeeded = (value) => {
    if (!Number.isFinite(value)) {
      return false;
    }
    if (currentPageRef.current === value) {
      return false;
    }
    currentPageRef.current = value;
    setCurrentPage(value);
    return true;
  };

  const setTotalItemsIfNeeded = (value) => {
    if (totalItemsRef.current === value) {
      return false;
    }
    totalItemsRef.current = value;
    setTotalItems(value);
    return true;
  };

  const setTotalPagesIfNeeded = (value) => {
    if (totalPagesRef.current === value) {
      return false;
    }
    totalPagesRef.current = value;
    setTotalPages(value);
    return true;
  };

  const updateClassList = (updater) => {
    setClassList((previousRaw) => {
      const previous = sanitizeClassEntries(previousRaw) ?? [];

      if (typeof updater === "function") {
        const nextValue = updater(previous);
        return Array.isArray(nextValue) ? nextValue : previous;
      }

      const sanitizedNext = sanitizeClassEntries(updater);
      return Array.isArray(sanitizedNext) ? sanitizedNext : previous;
    });
  };

  const updateClassListIfChanged = (nextList) => {
    if (!Array.isArray(nextList)) {
      return;
    }

    setClassList((previous) => {
      if (classListLengthRef.current === nextList.length) {
        const nextSignature = computeListSignature(nextList);
        if (classListSignatureRef.current === nextSignature) {
          return previous;
        }
      }

      const sanitizedNext = sanitizeClassEntries(nextList);
      return Array.isArray(sanitizedNext) ? sanitizedNext : previous;
    });
  };

  const sortClasses = (items, key = sortKey) =>
    [...items].sort((a, b) => compareValues(a, b, key));

  const hydratedUser = isMounted && hasHydrated ? user : null;
  const canManageRules =
    isMounted && hasHydrated && user?.permissions?.includes('ADD_ONLINE_CLASS_RULE');

  const normalizedPage = useMemo(() => {
    const positiveCurrentPage = resolvePositiveInteger(currentPage, 1);
    const knownTotalPages = Number.isFinite(totalPages)
      ? Math.max(totalPages, 1)
      : 1;
    const derivedFromItems =
      Number.isFinite(totalItems) && totalItems > 0 && normalizedItemsPerPage
        ? Math.ceil(totalItems / normalizedItemsPerPage)
        : null;
    const effectiveTotalPages = derivedFromItems
      ? Math.max(1, derivedFromItems)
      : knownTotalPages;
    return Math.min(Math.max(positiveCurrentPage, 1), effectiveTotalPages);
  }, [currentPage, totalPages, totalItems, normalizedItemsPerPage]);

  useEffect(() => {
    if (!hasHydrated || !authIdentifier) {
      if (lastFailedSignatureRef.current) {
        clearFailedSignature();
      }
      if (authFailureRef.current) {
        authFailureRef.current = false;
      }
      if (authError) {
        setAuthError(false);
      }
      return;
    }

    if (authFailureRef.current || lastFailedSignatureRef.current?.isAuthFailure) {
      return;
    }

    if (normalizedPage !== currentPage) {
      if (setCurrentPageIfNeeded(normalizedPage)) {
        return;
      }
    }

    if (lastNormalizedPageRef.current !== normalizedPage) {
      lastNormalizedPageRef.current = normalizedPage;
    }

    const requestDetails = {
      signature: JSON.stringify({
        page: normalizedPage,
        limit: normalizedItemsPerPage,
        searchTerm,
        approval: filterApproval,
        status: filterStatus,
        sortKey,
      }),
      page: normalizedPage,
      itemsPerPage: normalizedItemsPerPage,
      searchTerm,
      filterApproval,
      filterStatus,
      sortKey,
    };

    const failedSignature = lastFailedSignatureRef.current;

    if (
      failedSignature &&
      failedSignature.signature !== requestDetails.signature
    ) {
      clearFailedSignature(failedSignature);
    } else if (failedSignature) {
      const elapsed = Date.now() - failedSignature.timestamp;
      if (elapsed >= FAILED_SIGNATURE_RETRY_DELAY_MS) {
        clearFailedSignature(failedSignature);
      } else {
        const failureTimestamp =
          typeof failedSignature.failedAt === "number" &&
          Number.isFinite(failedSignature.failedAt)
            ? failedSignature.failedAt
            : failedSignature.timestamp;
        if (
          typeof failureTimestamp === "number" &&
          Number.isFinite(failureTimestamp)
        ) {
          const elapsed = Date.now() - failureTimestamp;
          if (elapsed < FAILED_SIGNATURE_RETRY_DELAY_MS) {
            return;
          }
        }
        clearFailedSignature(failedSignature);
      }
    }

    if (lastSuccessfulSignatureRef.current === requestDetails.signature) {
      if (
        pendingRequestRef.current &&
        pendingRequestRef.current.signature === requestDetails.signature
      ) {
        pendingRequestRef.current = null;
      }
      return;
    }

    if (inFlightRequestRef.current === requestDetails.signature) {
      return;
    }

    if (inFlightRequestRef.current) {
      if (
        !pendingRequestRef.current ||
        pendingRequestRef.current.signature !== requestDetails.signature
      ) {
        pendingRequestRef.current = requestDetails;
      }
      return;
    }

    const executeRequest = async (details) => {
      const {
        signature,
        page,
        itemsPerPage: limitValue,
        searchTerm: searchValue,
        filterApproval: approvalValue,
        filterStatus: statusValue,
        sortKey: sortValue,
      } = details;

      if (!isComponentMountedRef.current || !authIdentifierRef.current) {
        return;
      }

      inFlightRequestRef.current = signature;

      if (isComponentMountedRef.current && !loadingRef.current) {
        loadingRef.current = true;
        setLoading(true);
      }

      if (process.env.NODE_ENV !== "production") {
        console.debug("[AdminClassesTable] executeRequest", signature, {
          page,
          itemsPerPage: limitValue,
          searchTerm: searchValue,
          filterApproval: approvalValue,
          filterStatus: statusValue,
          sortKey: sortValue,
        });
      }

      try {
        let finalSignature = signature;
        const scheduleFiltering = shouldApplyScheduleFilter(statusValue);
        const statusQuery = mapStatusFilterToQuery(statusValue);
        const safeLimit = resolvePositiveInteger(limitValue);
        const baseParams = {
          limit: safeLimit,
          filter: searchValue,
          ...(approvalValue !== "All" ? { approval: approvalValue } : {}),
          ...(statusQuery ? { status: statusQuery } : {}),
        };

        const initialPage = scheduleFiltering ? 1 : page;
        const { data, meta } = await fetchAdminClasses({
          ...baseParams,
          page: initialPage,
        });

        if (scheduleFiltering) {
          const totalPagesFromMeta = meta?.totalPages ?? 1;
          let aggregatedData = data;

          if (totalPagesFromMeta > 1) {
            const subsequentPages = await Promise.all(
              Array.from({ length: totalPagesFromMeta - 1 }, (_, index) =>
                fetchAdminClasses({
                  ...baseParams,
                  page: index + 2,
                }).then((res) => res.data)
              )
            );
            aggregatedData = aggregatedData.concat(...subsequentPages);
          }

          const filteredData = aggregatedData.filter(
            (cls) =>
              cls.scheduleStatus?.toLowerCase() ===
              statusValue.toLowerCase()
          );
          const sortedData = sortClasses(filteredData, sortValue);
          const totalFilteredItems = sortedData.length;
          const totalFilteredPages = Math.max(
            1,
            Math.ceil(totalFilteredItems / safeLimit)
          );
          const normalizedPageRaw = Math.min(
            Math.max(page, 1),
            totalFilteredPages
          );
          let effectivePage = Number.isFinite(normalizedPageRaw)
            ? normalizedPageRaw
            : 1;
          const pageForSignature = Number.isFinite(normalizedPage)
            ? normalizedPage
            : effectivePage;
          if (
            Number.isFinite(pageForSignature) &&
            pageForSignature !== page
          ) {
            finalSignature = JSON.stringify({
              page: pageForSignature,
              limit: limitValue,
              searchTerm: searchValue,
              approval: approvalValue,
              status: statusValue,
              sortKey: sortValue,
            });
          }

          if (!isComponentMountedRef.current) {
            return;
          }

          setTotalItemsIfNeeded(totalFilteredItems);
          setTotalPagesIfNeeded(totalFilteredPages);

          const startIndex = (effectivePage - 1) * safeLimit;
          const paginatedData = sortedData.slice(
            startIndex,
            startIndex + safeLimit
          );

          if (!isComponentMountedRef.current) {
            return;
          }

          updateClassListIfChanged(paginatedData);
        } else {
          const sortedData = sortClasses(data, sortValue);

          if (!isComponentMountedRef.current) {
            return;
          }

          updateClassListIfChanged(sortedData);
          const nextTotalPages = meta?.totalPages ? Math.max(meta.totalPages, 1) : 1;
          const nextTotalItems = meta?.total ?? data.length;
          setTotalPagesIfNeeded(nextTotalPages);
          setTotalItemsIfNeeded(nextTotalItems);
        }

        lastSuccessfulSignatureRef.current = finalSignature;
        authFailureRef.current = false;
        if (isComponentMountedRef.current && authError) {
          setAuthError(false);
        }
        clearFailedSignature();
      } catch (err) {
        console.error(err);
        const previousFailure = lastFailedSignatureRef.current;
        const toastAlreadyShownForSignature =
          previousFailure?.signature === signature &&
          previousFailure?.toastShown;
        const shouldShowToast =
          isComponentMountedRef.current && !toastAlreadyShownForSignature;
        const responseStatusCode = err?.response?.status;
        const hadAuthFailure = authFailureRef.current;
        const isAuthFailure =
          responseStatusCode === 401 || responseStatusCode === 403;
        if (isAuthFailure) {
          authFailureRef.current = true;
          if (isComponentMountedRef.current) {
            setAuthError(true);
            updateClassList([]);
            setTotalItemsIfNeeded(0);
            setTotalPagesIfNeeded(1);
          }
        }
        if (shouldShowToast && (!isAuthFailure || !hadAuthFailure)) {
          toast.error("Failed to load classes");
        }
        clearFailedSignature();
        const statusCode =
          err?.response?.status ?? err?.status ?? err?.statusCode ?? null;
        const isAuthorizationError = statusCode === 401 || statusCode === 403;
        const hasValidAuth = Boolean(authIdentifierRef.current);
        const failureTimestamp = Date.now();
        if (!hasValidAuth || isAuthorizationError) {
          lastFailedSignatureRef.current = null;
          return;
        }
        const failureRecord = {
          signature,
          timestamp: failureTimestamp,
          failedAt: failureTimestamp,
          retryTimer: null,
          toastShown:
            toastAlreadyShownForSignature || shouldShowToast || false,
          isAuthFailure,
        };
        if (!isAuthFailure) {
          failureRecord.retryTimer = setTimeout(() => {
            if (!isComponentMountedRef.current || authFailureRef.current) {
              return;
            }
            const activeFailure = lastFailedSignatureRef.current;
            if (!activeFailure || activeFailure.signature !== signature) {
              return;
            }
            clearFailedSignature(activeFailure);
            if (
              lastSuccessfulSignatureRef.current === signature ||
              inFlightRequestRef.current ||
              (pendingRequestRef.current &&
                pendingRequestRef.current.signature === signature)
            ) {
              return;
            }
            executeRequest(details);
          }, FAILED_REQUEST_RETRY_DELAY_MS);
        }
        lastFailedSignatureRef.current = failureRecord;
      } finally {
        if (isComponentMountedRef.current && loadingRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
        inFlightRequestRef.current = null;

        const nextRequest = pendingRequestRef.current;
        if (nextRequest && nextRequest.signature !== signature) {
          pendingRequestRef.current = null;
          if (
            isComponentMountedRef.current &&
            !authFailureRef.current &&
            lastSuccessfulSignatureRef.current !== nextRequest.signature &&
            lastFailedSignatureRef.current?.signature !== nextRequest.signature
          ) {
            executeRequest(nextRequest);
          }
        } else if (nextRequest && nextRequest.signature === signature) {
          pendingRequestRef.current = null;
        }
      }
    };

    executeRequest(requestDetails);
  }, [
    normalizedPage,
    normalizedItemsPerPage,
    searchTerm,
    filterApproval,
    filterStatus,
    sortKey,
    hasHydrated,
    authIdentifier,
  ]);

  const formatCSVRow = (row) =>
    row
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",");

  const exportCSV = async () => {
    try {
      setExporting(true);
      const statusQuery = mapStatusFilterToQuery(filterStatus);
      const limit = 100;
      let page = 1;
      let allClasses = [];
      // Fetch every page of classes that match the current filters
      while (true) {
        const { data, meta } = await fetchAdminClasses({
          page,
          limit,
          filter: searchTerm,
          approval: filterApproval !== "All" ? filterApproval : undefined,
          status: statusQuery,
        });
        allClasses = allClasses.concat(data);
        const metaTotalPages =
          meta?.totalPages || meta?.total_pages || meta?.totalpages;
        if ((metaTotalPages && page >= metaTotalPages) || data.length < limit) {
          break;
        }
        page += 1;
      }

      const filteredClasses = shouldApplyScheduleFilter(filterStatus)
        ? allClasses.filter(
            (cls) =>
              cls.scheduleStatus?.toLowerCase() === filterStatus.toLowerCase()
          )
        : allClasses;
      const sortedClasses = [...filteredClasses].sort((a, b) =>
        a[sortKey] > b[sortKey] ? 1 : -1
      );
      const headers = [
        "Title",
        "Instructor",
        "Start Date",
        "End Date",
        "Category",
        "Publish Status",
      ];
      const rows = sortedClasses.map((cls) => [
        cls.title,
        cls.instructor,
        cls.start_date,
        cls.end_date,
        cls.category,
        cls.publishStatus,
      ]);
      const csvRows = [headers, ...rows].map(formatCSVRow);
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "online_classes.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Classes exported");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export classes");
    } finally {
      setExporting(false);
    }
  };

  
  const handleStatusChange = async (id, action, reason = "") => {
    if (!hydratedUser) {
      return;
    }
    const target = classList.find((c) => c.id === id);
    if (!target) {
      toast.warn("Unable to locate the selected class. Please refresh and try again.");
      setModalClass(null);
      return;
    }
    const targetTitle = target.title ? `"${target.title}"` : "the class";
    const targetInstructorId = target?.instructor_id;
    try {

      if (action === "approve") {
        const updated = await approveAdminClass(id);
        updateClassList((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, approvalStatus: "Approved", publishStatus: updated?.publishStatus }
              : c
          )
        );
        toast.success("Class approved");
        const message = `Class ${targetTitle} approved.`;
        await createNotification({ user_id: hydratedUser.id, type: "class_approved", message });
        await sendChatMessage(hydratedUser.id, { text: message });
        if (targetInstructorId && targetInstructorId !== hydratedUser.id) {
          await createNotification({
            user_id: targetInstructorId,
            type: "class_approved",
            message: `Your class ${targetTitle} was approved!`,
          });
          await sendChatMessage(targetInstructorId, {
            text: `Your class ${targetTitle} was approved!`,
          });
        }
        refreshNotifications?.();
        refreshMessages?.();
      } else if (action === "reject") {
        await rejectAdminClass(id, reason);
        updateClassList((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, approvalStatus: "Rejected" } : c
          )
        );
        toast.success("Class rejected");
        const message = `Class ${targetTitle} was rejected.`;
        await createNotification({ user_id: hydratedUser.id, type: "class_rejected", message });
        await sendChatMessage(hydratedUser.id, { text: `${message} Reason: ${reason}` });
        if (targetInstructorId && targetInstructorId !== hydratedUser.id) {
          await createNotification({
            user_id: targetInstructorId,
            type: "class_rejected",
            message: `Your class ${targetTitle} was rejected.`,
          });
          await sendChatMessage(targetInstructorId, {
            text: `Your class ${targetTitle} was rejected. Reason: ${reason}`,
          });
        }
        refreshNotifications?.();
        refreshMessages?.();
      } else if (action === "toggle") {
        const updated = await toggleClassStatus(id);
        if (!updated) {
          throw new Error("Failed to toggle class status");
        }
        updateClassList((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
        );
        toast.success("Status updated");
        const message = `Class ${targetTitle} publish status changed to ${updated.publishStatus}.`;
        await createNotification({ user_id: hydratedUser.id, type: "class_status_changed", message });
        await sendChatMessage(hydratedUser.id, { text: message });
        if (targetInstructorId && targetInstructorId !== hydratedUser.id) {
          await createNotification({
            user_id: targetInstructorId,
            type: "class_status_changed",
            message: `Your class ${targetTitle} publish status was changed to ${updated.publishStatus}.`,
          });
          await sendChatMessage(targetInstructorId, {
            text: `Your class ${targetTitle} publish status was changed to ${updated.publishStatus}.`,
          });
        }
        refreshNotifications?.();
        refreshMessages?.();
      }

    } catch (err) {
      console.error(err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update class";
      toast.error(errorMessage);
    } finally {
      setModalClass(null);
    }
  };

  const handleDeleteClass = async (id) => {
    const singleItemOnPage = classList.length === 1;
    const previousPage = currentPage > 1 ? currentPage - 1 : 1;

    try {
      await deleteAdminClass(id);

      const updatedList = classList.filter((cls) => cls.id !== id);
      const nextTotalItems = Math.max(
        totalItemsRef.current - 1,
        updatedList.length,
        0
      );
      const derivedItemsPerPage =
        pageSizeSetting === "all"
          ? resolvePositiveInteger(
              Math.max(nextTotalItems, updatedList.length, 1),
              DEFAULT_PAGE_SIZE
            )
          : resolvePositiveInteger(pageSizeSetting, DEFAULT_PAGE_SIZE);
      const nextTotalPages = Math.max(
        1,
        Math.ceil(
          nextTotalItems > 0
            ? nextTotalItems / derivedItemsPerPage
            : 0
        )
      );

      updateClassList(updatedList);
      setTotalItemsIfNeeded(nextTotalItems);
      setTotalPagesIfNeeded(nextTotalPages);

      if (updatedList.length === 0 && currentPageRef.current > 1) {
        const candidatePage = Math.min(
          currentPageRef.current - 1,
          nextTotalPages
        );
        setCurrentPageIfNeeded(candidatePage);
      }

      toast.success("Class deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete class");
    } finally {
      setModalClass(null);
    }
  };

  const trimmedRejectionReason = rejectionReason.trim();
  const isRejectionReasonValid =
    trimmedRejectionReason.length >= MIN_REJECTION_REASON_LENGTH;

  const handleModalConfirm = () => {
    if (!modalClass) {
      return;
    }

    if (modalType === 'reject') {
      if (!isRejectionReasonValid) {
        toast.error(t('rejection_reason_min_length'));
        return;
      }
      handleStatusChange(modalClass.id, 'reject', trimmedRejectionReason);
      return;
    }

    handleDeleteClass(modalClass.id);
  };

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  if (authError) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 text-center">
        Unable to load classes. Please sign in again to continue.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 text-center">
        Loading classes...
      </div>
    );
  }

  if (!classList.length) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 text-center">
        No classes found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-1/2">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or instructor"
            className="border border-gray-300 rounded-xl px-4 py-2 w-full text-sm focus:ring-2 focus:ring-yellow-500"
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-1/2 justify-end items-center">
          <select
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm"
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            value={filterStatus}
          >
            <option value="All">All Schedule</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm"
            onChange={(e) => { setFilterApproval(e.target.value); setCurrentPage(1); }}
            value={filterApproval}
          >
            <option value="All">All Approval</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm"
            onChange={(e) => setSortKey(e.target.value)}
          >
            <option value="start_date">Sort by Start Date</option>
            <option value="title">Sort by Title</option>
            <option value="instructor">Sort by Instructor</option>
          </select>
          <select
            value={pageSizeSetting}
            onChange={(e) => {
              const { value } = e.target;

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
            className="border border-gray-300 rounded-xl px-2 py-2 text-sm"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="all">All</option>
          </select>
          <button
            onClick={exportCSV}
            className={`flex items-center gap-2 text-sm text-white rounded-xl px-4 py-2 ${
              exporting ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
            title={
              exporting
                ? "Export in progress"
                : "Export all filtered classes to CSV"
            }
            disabled={exporting}
          >
            <FaDownload /> {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 text-sm uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Image</th>
              <th className="px-6 py-3 text-left">Title</th>
              <th className="px-6 py-3 text-left">Instructor</th>
              <th className="px-6 py-3 text-left">Start Date</th>
              <th className="px-6 py-3 text-left">End Date</th>
              <th className="px-6 py-3 text-left">Category</th>
              <th className="px-6 py-3 text-left">Price</th>
              <th className="px-6 py-3 text-left">Schedule</th>
              <th className="px-6 py-3 text-left">Publish</th>
              <th className="px-6 py-3 text-left">Approval</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {classList.map((cls) => (
              <tr key={cls.id} className="hover:bg-yellow-50">
                <td className="px-6 py-4">
                  {cls.cover_image && (
                    <img
                      src={cls.cover_image}
                      alt={cls.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                </td>
                <td className="px-6 py-4 font-semibold">{cls.title}</td>
                <td className="px-6 py-4">{cls.instructor}</td>
                <td className="px-6 py-4">{cls.start_date}</td>
                <td className="px-6 py-4">{cls.end_date || '-'}</td>
                <td className="px-6 py-4">{cls.category || '-'}</td>
                <td className="px-6 py-4">
                  {cls.price > 0 ? `$${cls.price}` : t('free_label')}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${{
                    Upcoming: 'bg-green-100 text-green-800',
                    Ongoing: 'bg-blue-100 text-blue-800',
                    Completed: 'bg-gray-300 text-gray-800'
                  }[cls.scheduleStatus] || 'bg-gray-200 text-gray-800'}`}
                  >
                    {cls.scheduleStatus}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleStatusChange(cls.id, 'toggle')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        cls.publishStatus === 'published'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      }`}
                  >
                    {cls.publishStatus === 'published' ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  {cls.approvalStatus === 'Pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(cls.id, 'approve')}
                        className="bg-green-100 hover:bg-green-200 text-green-700 text-xs px-3 py-1 rounded-full"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => { setModalClass(cls); setModalType('reject'); setRejectionReason(''); }}
                        className="bg-red-100 hover:bg-red-200 text-red-700 text-xs px-3 py-1 rounded-full"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        {
                          Approved: 'bg-green-100 text-green-800',
                          Rejected: 'bg-red-100 text-red-700'
                        }[cls.approvalStatus] || 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {cls.approvalStatus}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-1 space-y-1">
                  <button title="Approve Class"
                    onClick={() => handleStatusChange(cls.id, 'approve')}
                    className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded shadow">
                    <FaCheck className="w-4 h-4" />
                  </button>
                  <button title="Reject Class"
                    onClick={() => { setModalClass(cls); setModalType('reject'); setRejectionReason(''); }}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded shadow">
                    <FaTimes className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/dashboard/admin/online-classes/edit/${cls.id}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded shadow"
                    title="Manage Class"
                  >
                    <FaEdit className="w-4 h-4" />
                  </Link>
                  {canManageRules && (
                    <Link
                      href={`/dashboard/admin/online-classes/${cls.id}/rules`}
                      className="bg-teal-500 hover:bg-teal-600 text-white text-xs px-2 py-1 rounded shadow"
                      title="Manage Rules"
                    >
                      <FaList className="w-4 h-4" />
                    </Link>
                  )}
                  <button title="Delete Class"
                    onClick={() => { setModalClass(cls); setModalType('delete'); }}
                    className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded shadow">
                    <FaTrash className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/dashboard/admin/online-classes/${cls.id}/students`}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow"
                    title="View Enrolled Students"
                  >
                    <FaUserGraduate className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/dashboard/admin/online-classes/${cls.id}`}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2 py-1 rounded shadow"
                    title="View Class Details"
                  >
                    <FaCalendarAlt className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/dashboard/admin/online-classes/${cls.id}/analytics`}
                    title="View Analytics"
                    className="bg-purple-500 hover:bg-yellow-600 text-white text-xs px-2 py-1 rounded shadow"
                  >
                    <FaChartBar className="w-4 h-4" /> Analytics
                  </Link>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * normalizedItemsPerPage + 1}–
            {Math.min(currentPage * normalizedItemsPerPage, totalItems)} of {totalItems} classes
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} disabled={currentPage === 1} className="text-sm px-3 py-1 bg-gray-200 hover:bg-yellow-100 rounded disabled:opacity-50">
              <FaChevronLeft />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`text-sm px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-yellow-500 text-white' : 'bg-gray-100 hover:bg-yellow-100'}`}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={handleNext} disabled={currentPage === totalPages} className="text-sm px-3 py-1 bg-gray-200 hover:bg-yellow-100 rounded disabled:opacity-50">
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalClass && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl text-center">
            <h2 className="text-xl font-bold mb-2">{modalType === 'reject' ? 'Confirm Rejection' : 'Confirm Deletion'}</h2>
            <p className="mb-4 text-gray-600">Are you sure you want to {modalType} <strong>{modalClass.title}</strong>?</p>
            {modalType === 'reject' && (
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
                placeholder="Enter rejection reason"
              />
            )}
            <div className="flex justify-center gap-4">
              <button onClick={() => setModalClass(null)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
              <button
                onClick={handleModalConfirm}
                disabled={modalType === 'reject' && !isRejectionReasonValid}
                className={`px-4 py-2 rounded text-white ${
                  modalType === 'reject' ? 'bg-red-600' : 'bg-gray-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Yes, {modalType === 'reject' ? 'Reject' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
