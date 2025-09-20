import React, { useState } from "react";
import { useRouter } from "next/router";
import withAuthProtection from "@/hooks/withAuthProtection";
import useTutorialsData from "@/hooks/admin/tutorials/useTutorialsData";
import useTutorialFilters from "@/hooks/admin/tutorials/useTutorialFilters";
import useBulkSelection from "@/hooks/admin/tutorials/useBulkSelection";
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
import { TUTORIAL_STATUS } from "@shared/tutorialStatus";
import useTutorialsData from "@/hooks/admin/tutorials/useTutorialsData";
import useTutorialFilters from "@/hooks/admin/tutorials/useTutorialFilters";
import useBulkSelection from "@/hooks/admin/tutorials/useBulkSelection";

function AdminTutorialsPage() {
  const { t } = useTranslation("dashboard", { keyPrefix: "tutorialsPage" });
  const router = useRouter();
  const { tutorials, setTutorials, categories, loading, meta, setMeta } =
    useTutorialsData(t);

  const {
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    filterApproval,
    setFilterApproval,
    currentPage,
    setCurrentPage,
    filteredTutorials,
    paginatedTutorials,
    totalPages,
    startIndex,
    goToPage,
  } = useTutorialFilters(tutorials);

  const totalResults = filteredTutorials.length;
  const paginatedCount = paginatedTutorials.length;
  const displayEndIndex =
    totalResults === 0
      ? 0
      : Math.min(startIndex + paginatedCount, totalResults);

  const {
    selectedTutorials,
    setSelectedTutorials,
    toggleSelectOne,
    toggleSelectAll,
    clearSelected,
  } = useBulkSelection(paginatedTutorials, [
    searchQuery,
    filterCategory,
    filterStatus,
    filterApproval,
  ]);

  const totalResults = filteredTutorials.length;

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
        toast.error("Tutorial not found");
        return;
      }
      await toggleTutorialStatus(id);
      const newStatus =
        existing.status === TUTORIAL_STATUS.PUBLISHED
          ? TUTORIAL_STATUS.DRAFT
          : TUTORIAL_STATUS.PUBLISHED;
      const target = { ...existing, status: newStatus };
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
        toast.warn("Status updated but failed to send some notifications.");
      }
      refreshNotifications?.();
      refreshMessages?.();
    } catch (err) {
      console.error(err);
      toast.error(t("update_failed"));
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
      toast.success(t("deleted"));
    } catch (err) {
      console.error(err);
      toast.error(t("delete_failed"));
    } finally {
      setSelectedTutorials((prev) =>
        prev.filter((id) => id !== tutorialToDelete),
      );
      setTutorialToDelete(null);
      setIsModalOpen(false);
    }
  };

  const handleConfirmReject = async (reason) => {
    try {
      const existing = tutorials.find((tut) => tut.id === tutorialToReject);
      if (!existing) {
        toast.error("Tutorial not found");
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
      toast.success(t("rejected"));
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
        toast.warn(
          "Rejection processed but failed to send some notifications.",
        );
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
      toast.success(t("approved"));
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
        toast.warn("Tutorial approved but failed to send some notifications.");
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
      toast.success(t("bulk_deleted"));
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
      toast.success(t("bulk_approved"));
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
              📚 {t("title")}
            </h1>
            <p className="text-gray-600 mt-1">{t("description")}</p>
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
            <p className="text-2xl font-bold">{tutorials.length}</p>
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
            paginatedTutorials={paginatedTutorials}
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
              startIndex={startIndex}
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
