import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import withAuthProtection from "@/hooks/withAuthProtection";
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
import ConfirmModal from "@/components/common/ConfirmModal";
import RejectionReasonModal from "@/components/common/RejectionReasonModal";
import { fetchAllCategories } from "@/services/admin/categoryService";
import {
  fetchAllTutorials,
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

function AdminTutorialsPage() {
  const { t } = useTranslation("dashboard", { keyPrefix: "tutorialsPage" });
  const router = useRouter();
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = useAuthStore((state) => state.user);
  const refreshNotifications = useNotificationStore((state) => state.fetch);
  const refreshMessages = useMessageStore((state) => state.fetch);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterApproval, setFilterApproval] = useState("All");
  const [categories, setCategories] = useState([]);

  // Modals and Selections
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [tutorialToDelete, setTutorialToDelete] = useState(null);
  const [tutorialToReject, setTutorialToReject] = useState(null);
  const [selectedTutorials, setSelectedTutorials] = useState([]);

  useEffect(() => {
    setSelectedTutorials([]);
  }, [searchQuery, filterCategory, filterStatus, filterApproval]);

  // Load tutorials and categories from backend on mount
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [tuts, cats] = await Promise.all([
          fetchAllTutorials({ signal: controller.signal }),
          fetchAllCategories({}, { signal: controller.signal }),
        ]);
        if (!isMounted) return;
        setTutorials(tuts);
        setCategories(cats?.data || cats || []);
      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;
        console.error(err);
        if (isMounted) toast.error(t('load_error'));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const tutorialsPerPage = 10;

  // Filtering
  const filteredTutorials = tutorials.filter((tut) => {
    const matchesSearch =
      tut.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tut.instructor?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "All" || tut.category === filterCategory;
    const matchesStatus = filterStatus === "All" || tut.status === filterStatus;
    const matchesApproval =
      filterApproval === "All" || tut.approvalStatus === filterApproval;
    return matchesSearch && matchesCategory && matchesStatus && matchesApproval;
  });

  const totalPages = Math.ceil(filteredTutorials.length / tutorialsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.min(currentPage, totalPages) || 1);
    }
  }, [currentPage, totalPages]);
  const startIndex = (currentPage - 1) * tutorialsPerPage;
  const endIndex = startIndex + tutorialsPerPage;
  const paginatedTutorials = filteredTutorials.slice(startIndex, endIndex);

  // Functions
  const toggleSelectOne = (id) => {
    setSelectedTutorials((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = (isChecked) => {
    if (isChecked) {
      const pageIds = paginatedTutorials.map((tut) => tut.id);
      setSelectedTutorials((prevSelected) => [
        ...new Set([...prevSelected, ...pageIds]), // Add only current page IDs
      ]);
    } else {
      const pageIds = paginatedTutorials.map((tut) => tut.id);
      setSelectedTutorials(
        (prevSelected) => prevSelected.filter((id) => !pageIds.includes(id)), // Remove only current page IDs
      );
    }
  };

  const clearSelected = () => setSelectedTutorials([]);

  const togglePublishStatus = async (id) => {
    try {
      const existing = tutorials.find((tut) => tut.id === id);
      if (!existing) {
        toast.error("Tutorial not found");
        return;
      }
      await toggleTutorialStatus(id);
      const newStatus = existing.status === "Published" ? "Draft" : "Published";
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

  // Pagination controls
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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
              {tutorials.filter((t) => t.status === "Published").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
            <p className="text-gray-600">Drafts</p>
            <p className="text-2xl font-bold">
              {tutorials.filter((t) => t.status === "Draft").length}
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


          {filteredTutorials.length > 0 && !loading && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              goToPage={goToPage}
              startIndex={startIndex}
              endIndex={Math.min(endIndex, filteredTutorials.length)}
              totalResults={filteredTutorials.length}
            />
          )}
        </div>

        {/* Modals */}
        <ConfirmModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title={t("confirm_title")}
          message={t("confirm_delete")}
        />

        <RejectionReasonModal
          isOpen={isRejectionModalOpen}
          onClose={() => setIsRejectionModalOpen(false)}
          onConfirm={handleConfirmReject}
          title={t("reject_title")}
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
