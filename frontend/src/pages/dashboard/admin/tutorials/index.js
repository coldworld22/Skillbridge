import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import withAuthProtection from "@/hooks/withAuthProtection";
import useTutorialsData from "@/hooks/admin/tutorials/useTutorialsData";
import useTutorialFilters from "@/hooks/admin/tutorials/useTutorialFilters";
import useBulkSelection from "@/hooks/admin/tutorials/useBulkSelection";
import useTutorialFilters from "@/hooks/admin/tutorials/useTutorialFilters";
import { Button } from "@/components/ui/button";
import { FaPlus } from "react-icons/fa";
import Filters from "@/components/dashboard/admin/tutorials/Filters";
import TutorialsTable from "@/components/dashboard/admin/tutorials/TutorialsTable";
import BulkActions from "@/components/dashboard/admin/tutorials/BulkActions";
import PaginationControls from "@/components/dashboard/admin/tutorials/PaginationControls";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import AdminLayout from "@/components/layouts/AdminLayout";
import DeleteTutorialModal from "@/components/dashboard/admin/tutorials/DeleteTutorialModal";
import RejectTutorialModal from "@/components/dashboard/admin/tutorials/RejectTutorialModal";
import {
  permanentlyDeleteTutorial,
  toggleTutorialStatus,
  approveTutorial,
  rejectTutorial,
  bulkApproveTutorials,
  bulkDeleteTutorials,
} from "@/services/admin/tutorialService";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import { TUTORIAL_STATUS } from "@/constants/tutorialStatus";

function AdminTutorialsPage() {
  const { t } = useTranslation("dashboard", { keyPrefix: "tutorialsPage" });
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [serverFilters, setServerFilters] = useState({});
  const {
    tutorials,
    setTutorials,
    categories,
    loading,
    meta,
    setMeta,
  } = useTutorialsData(t, {
    page: currentPage,
    pageSize,
    filters: serverFilters,
  });

  const {
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    filterApproval,
    setFilterApproval,
    filteredTutorials,
  } = useTutorialFilters(tutorials);

  useEffect(() => {
    setServerFilters((prev) => {
      const next = {};

      const trimmedSearch = searchQuery.trim();
      if (trimmedSearch) {
        next.search = trimmedSearch;
      }

      if (filterCategory) {
        next.category = filterCategory;
      }

      if (filterStatus) {
        next.status = filterStatus;
      }

      if (filterApproval) {
        next.approval = filterApproval;
      }

      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);

      if (
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[key] === next[key])
      ) {
        return prev;
      }

      return next;
    });
  }, [searchQuery, filterCategory, filterStatus, filterApproval]);

  useEffect(() => {
    if (meta?.per_page && meta.per_page !== pageSize) {
      setPageSize(meta.per_page);
    }
  }, [meta?.per_page, pageSize]);

  useEffect(() => {
    if (meta?.last_page && currentPage > meta.last_page) {
      setCurrentPage(Math.max(1, meta.last_page));
    }
  }, [meta?.last_page, currentPage]);

  const totalResults = meta?.total ?? filteredTutorials.length;
  const totalPages =
    meta?.last_page ??
    (pageSize > 0 ? Math.max(1, Math.ceil(totalResults / pageSize)) : 1);
  const pageItemCount = filteredTutorials.length;
  const displayStartIndex =
    totalResults === 0 || pageItemCount === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;
  const displayEndIndex =
    totalResults === 0 || pageItemCount === 0
      ? 0
      : Math.min(displayStartIndex + pageItemCount - 1, totalResults);
  const paginationStartIndex = displayStartIndex > 0 ? displayStartIndex - 1 : 0;

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };


  const {
    selectedTutorials,
    setSelectedTutorials,
    toggleSelectOne,
    toggleSelectAll,
    clearSelected,
  } = useBulkSelection(filteredTutorials, [
    searchQuery,
    filterCategory,
    filterStatus,
    filterApproval,
    currentPage,
  ]);

  const user = useAuthStore((state) => state.user);
  const refreshNotifications = useNotificationStore((state) => state.fetch);
  const refreshMessages = useMessageStore((state) => state.fetch);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [tutorialToDelete, setTutorialToDelete] = useState(null);
  const [tutorialToReject, setTutorialToReject] = useState(null);

  const togglePublishStatus = async (id) => {
    try {
      const existing = tutorials.find((tut) => tut.id === id);
      if (!existing) {
        toast.error(t("not_found"));
        return;
      }
      const updated = await toggleTutorialStatus(id);
      if (!updated) {
        toast.error(t("update_failed"));
        return;
      }

      const toggledStatus =
        existing.status === TUTORIAL_STATUS.PUBLISHED
          ? TUTORIAL_STATUS.DRAFT
          : TUTORIAL_STATUS.PUBLISHED;

      const resolvedStatus = updated.status ?? toggledStatus;
      const moderationStatus =
        updated.moderation_status ?? existing.approvalStatus ?? "Pending";

      const target = {
        ...existing,
        status: resolvedStatus,
        approvalStatus: moderationStatus,
        rejectionReason: null,
      };
      setTutorials((prev) =>
        prev.map((tut) =>
          tut.id === id
            ? { ...target, updatedAt: new Date().toISOString() }
            : tut,
        ),
      );
      const message = `Tutorial "${target.title}" status changed to ${target.status}.`;
      toast.success(t("status_updated"));
      const notificationPromises = [
        createNotification({
          user_id: user.id,
          type: "tutorial_status_changed",
          message,
        }),
        sendChatMessage(user.id, { text: message }),
      ];
      if (target.instructorId && target.instructorId !== user.id) {
        notificationPromises.push(
          createNotification({
            user_id: target.instructorId,
            type: "tutorial_status_changed",
            message: `Your tutorial "${target.title}" status was changed to ${target.status}.`,
          }),
          sendChatMessage(target.instructorId, {
            text: `Your tutorial "${target.title}" status was changed to ${target.status}.`,
          }),
        );
      }
      const notificationResults =
        await Promise.allSettled(notificationPromises);
      if (notificationResults.some((res) => res.status === "rejected")) {
        notificationResults
          .filter((res) => res.status === "rejected")
          .forEach((res) => console.error(res.reason));
        toast.warn(t("status_update_partial"));
      }
      refreshNotifications?.();
      refreshMessages?.();
    } catch (err) {
      console.error(err);
      toast.error(t("status_update_failed"));
    }
  };

  const openDeleteModal = (id) => {
    setTutorialToDelete(id);
    setIsModalOpen(true);
  };

  const openRejectModal = (id) => {
    setTutorialToReject(id);
    setIsRejectionModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tutorialToDelete) return;
    try {
      await permanentlyDeleteTutorial(tutorialToDelete);
      setTutorials((prev) => prev.filter((tut) => tut.id !== tutorialToDelete));
      setMeta((prev) =>
        prev && typeof prev.total === "number"
          ? { ...prev, total: Math.max(0, prev.total - 1) }
          : prev,
      );
      toast.success(t("delete_success"));
    } catch (err) {
      console.error(err);
      toast.error(t("delete_failed"));
    } finally {
      setSelectedTutorials((prev) => prev.filter((id) => id !== tutorialToDelete));
      setTutorialToDelete(null);
      setIsModalOpen(false);
    }
  };

  const handleConfirmReject = async (reason) => {
    try {
      const existing = tutorials.find((tut) => tut.id === tutorialToReject);
      if (!existing) {
        toast.error(t("not_found"));
        return;
      }
      await rejectTutorial(tutorialToReject, reason);
      const target = {
        ...existing,
        approvalStatus: "Rejected",
        rejectionReason: reason,
      };
      setTutorials((prev) =>
        prev.map((tut) =>
          tut.id === tutorialToReject
            ? { ...target, updatedAt: new Date().toISOString() }
            : tut,
        ),
      );
      toast.success(t("reject_success"));
      const message = `Tutorial "${target.title}" was rejected.`;
      const notificationPromises = [
        createNotification({
          user_id: user.id,
          type: "tutorial_rejected",
          message,
        }),
        sendChatMessage(user.id, { text: `${message} Reason: ${reason}` }),
      ];
      if (target.instructorId && target.instructorId !== user.id) {
        notificationPromises.push(
          createNotification({
            user_id: target.instructorId,
            type: "tutorial_rejected",
            message: `Your tutorial "${target.title}" was rejected.`,
          }),
          sendChatMessage(target.instructorId, {
            text: `Your tutorial "${target.title}" was rejected. Reason: ${reason}`,
          }),
        );
      }
      const notificationResults =
        await Promise.allSettled(notificationPromises);
      if (notificationResults.some((res) => res.status === "rejected")) {
        notificationResults
          .filter((res) => res.status === "rejected")
          .forEach((res) => console.error(res.reason));
        toast.warn(t("reject_partial_failure"));
      }
      refreshNotifications?.();
      refreshMessages?.();
    } catch (err) {
      console.error(err);
      toast.error(t("reject_failed"));
    } finally {
      setIsRejectionModalOpen(false);
      setTutorialToReject(null);
    }
  };

  const handleApproval = async (id) => {
    try {
      await approveTutorial(id);
      let target;
      setTutorials((prev) =>
        prev.map((tut) => {
          if (tut.id === id) {
            target = { ...tut, approvalStatus: "Approved" };
            return { ...target, updatedAt: new Date().toISOString() };
          }
          return tut;
        }),
      );
      toast.success(t("approval_success"));
      const message = `Tutorial "${target.title}" approved.`;
      const notificationPromises = [
        createNotification({
          user_id: user.id,
          type: "tutorial_approved",
          message,
        }),
        sendChatMessage(user.id, { text: message }),
      ];
      if (target.instructorId && target.instructorId !== user.id) {
        notificationPromises.push(
          createNotification({
            user_id: target.instructorId,
            type: "tutorial_approved",
            message: `Your tutorial "${target.title}" was approved!`,
          }),
          sendChatMessage(target.instructorId, {
            text: `Your tutorial "${target.title}" was approved!`,
          }),
        );
      }
      const notificationResults =
        await Promise.allSettled(notificationPromises);
      if (notificationResults.some((res) => res.status === "rejected")) {
        notificationResults
          .filter((res) => res.status === "rejected")
          .forEach((res) => console.error(res.reason));
        toast.warn(t("approval_partial_failure"));
      }
      refreshNotifications?.();
      refreshMessages?.();
    } catch (err) {
      console.error(err);
      toast.error(t("approval_failed"));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTutorials.length === 0) return;
    try {
      await bulkDeleteTutorials(selectedTutorials);
      setTutorials((prev) =>
        prev.filter((tut) => !selectedTutorials.includes(tut.id)),
      );
      setMeta((prev) =>
        prev && typeof prev.total === "number"
          ? { ...prev, total: Math.max(0, prev.total - selectedTutorials.length) }
          : prev,
      );
      toast.success(t("bulk_delete_success"));
    } catch (err) {
      console.error(err);
      toast.error(t("bulk_delete_failed"));
    } finally {
      setSelectedTutorials([]);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedTutorials.length === 0) return;
    try {
      await bulkApproveTutorials(selectedTutorials);
      setTutorials((prev) =>
        prev.map((tut) =>
          selectedTutorials.includes(tut.id)
            ? {
                ...tut,
                approvalStatus: "Approved",
                updatedAt: new Date().toISOString(),
              }
            : tut,
        ),
      );
      toast.success(t("bulk_approve_success"));
    } catch (err) {
      console.error(err);
      toast.error(t("bulk_approve_failed"));
    }
    setSelectedTutorials([]);
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 min-h-screen space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              📚 {t("heading")}
            </h1>
            <p className="text-gray-600 mt-1">{t("subheading")}</p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/admin/tutorials/create")}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-2.5 px-6 rounded-lg flex items-center shadow-md hover:shadow-lg transition-all"
          >
            <FaPlus className="mr-2" /> {t("create_tutorial")}
          </Button>
        </div>

        {/* Bulk Actions */}
        <BulkActions
          count={selectedTutorials.length}
          onBulkApprove={handleBulkApprove}
          onBulkDelete={handleBulkDelete}
          onClearSelected={clearSelected}
        />

        {/* Filters Card */}
        <Filters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterApproval={filterApproval}
          setFilterApproval={setFilterApproval}
          categories={categories}
          setCurrentPage={setCurrentPage}
        />

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
            <p className="text-gray-600">Total Tutorials</p>
            <p className="text-2xl font-bold">{meta?.total ?? 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500">
            <p className="text-gray-600">Pending Approval</p>
            <p className="text-2xl font-bold">
              {tutorials.filter((t) => t.approvalStatus === "Pending").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
            <p className="text-gray-600">Published</p>
            <p className="text-2xl font-bold">
              {tutorials.filter((t) => t.status === TUTORIAL_STATUS.PUBLISHED).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
            <p className="text-gray-600">Drafts</p>
            <p className="text-2xl font-bold">
              {tutorials.filter((t) => t.status === TUTORIAL_STATUS.DRAFT).length}
            </p>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <TutorialsTable
            paginatedTutorials={filteredTutorials}
            loading={loading}
            selectedTutorials={selectedTutorials}
            toggleSelectAll={toggleSelectAll}
            toggleSelectOne={toggleSelectOne}
            togglePublishStatus={togglePublishStatus}
            handleApproval={handleApproval}
            openRejectModal={openRejectModal}
            openDeleteModal={openDeleteModal}
            setSearchQuery={setSearchQuery}
            setFilterCategory={setFilterCategory}
            setFilterStatus={setFilterStatus}
            setFilterApproval={setFilterApproval}
            setCurrentPage={setCurrentPage}
            onEdit={(id) => router.push(`/dashboard/admin/tutorials/${id}/edit`)}
          />
          {totalResults > 0 && !loading && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              goToPage={goToPage}
              startIndex={paginationStartIndex}
              endIndex={displayEndIndex}
              totalResults={totalResults}
            />
          )}
        </div>

        {/* Modals */}
        <DeleteTutorialModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmDelete}
          t={t}
        />

        <RejectTutorialModal
          isOpen={isRejectionModalOpen}
          onClose={() => setIsRejectionModalOpen(false)}
          onConfirm={handleConfirmReject}
          t={t}
        />
      </div>
    </AdminLayout>
  );
}

const ProtectedAdminTutorialsPage = withAuthProtection(AdminTutorialsPage, {
  permissions: ["view_tutorials"],
});

export default ProtectedAdminTutorialsPage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["dashboard"],
        nextI18NextConfig,
      )),
    },
  };
}
