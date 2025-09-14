import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import InstructorLayout from '@/components/layouts/InstructorLayout';
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import { FaPlus, FaSearch, FaFilter, FaSortAmountDown } from "react-icons/fa";
import TutorialCard from "@/components/instructor/tutorials/TutorialCard";
import {
  fetchInstructorTutorials,
  submitTutorialForReview,
  deleteInstructorTutorial,
} from "@/services/instructor/tutorialService";
import ProgressChecklistModal from "@/components/tutorials/ProgressChecklistModal";
import ConfirmModal from "@/components/common/ConfirmModal";
import { toast } from "react-toastify";
import useInstructorTutorials from "@/hooks/useInstructorTutorials";

export default function InstructorTutorialsPage() {
  const router = useRouter();
  const { t } = useTranslation(["dashboard", "tutorials"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    tutorials,
    setTutorials,
    sortBy,
    setSortBy,
    handleSearch,
    handleFilter,
    filteredTutorials,
  } = useInstructorTutorials();
  const [checklistTutorial, setChecklistTutorial] = useState(null);
  const [showChecklist, setShowChecklist] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const openConfirmModal = ({ title, message, onConfirm }) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const data = await fetchInstructorTutorials({ signal: controller.signal });
        setTutorials(data?.data || data || []);
      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;
        console.error(err);
        setError(t("tutorials:list.load_error"));
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      controller.abort();
    };
  }, []);

  const handleDelete = (id) => {
    openConfirmModal({
      title: t("dashboard:tutorialsPage.delete_confirm_title"),
      message: t("dashboard:tutorialsPage.delete_confirm_message"),
      onConfirm: async () => {
        try {
          await deleteInstructorTutorial(id);
          setTutorials((prev) => prev.filter((tut) => tut.id !== id));
          toast.success(t("dashboard:tutorialsPage.delete_success"));
        } catch (err) {
          console.error(err);
          toast.error(t("dashboard:tutorialsPage.delete_failed"));
        } finally {
          closeConfirmModal();
        }
      },
    });
  };

  if (loading) {
    return (
      <InstructorLayout>
        <div className="p-6 flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          <span className="sr-only">{t('loading', { ns: 'common' })}</span>
        </div>
      </InstructorLayout>
    );
  }

  if (error) {
    return (
      <InstructorLayout>
        <div className="p-6 text-red-500 bg-red-50 rounded-lg max-w-md mx-auto mt-10 text-center">
          {error}
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between items-center mb-8 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t("dashboard:tutorialsPage.heading")}
            </h1>
            <p className="text-gray-600 mt-1">
              {t("dashboard:tutorialsPage.subheading")}
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/instructor/tutorials/create")}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-3 px-6 rounded-xl flex items-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <FaPlus className="mr-2" /> {t("dashboard:tutorialsPage.create_tutorial")}
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl p-5 mb-8 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t("tutorials:list.search_placeholder")}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onChange={(e) => handleFilter(e.target.value)}
              >
                <option value="">{t("dashboard:tutorialsPage.status_all")}</option>
                <option value="Draft">{t("dashboard:tutorialsPage.status_label.draft")}</option>
                <option value="Pending">{t("dashboard:tutorialsPage.status_label.pending")}</option>
                <option value="Approved">{t("dashboard:tutorialsPage.status_label.approved")}</option>
                <option value="Rejected">{t("dashboard:tutorialsPage.status_label.rejected")}</option>
              </select>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSortAmountDown className="text-gray-400" />
              </div>
              <select
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">{t("dashboard:tutorialsPage.sort_newest")}</option>
                <option value="oldest">{t("dashboard:tutorialsPage.sort_oldest")}</option>
                <option value="views">{t("dashboard:tutorialsPage.sort_views")}</option>
                <option value="enrollments">{t("dashboard:tutorialsPage.sort_enrollments")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">{t("dashboard:tutorialsPage.total_tutorials")}</div>
            <div className="text-2xl font-bold text-indigo-600">{tutorials.length}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">{t("dashboard:tutorialsPage.published")}</div>
            <div className="text-2xl font-bold text-green-600">
              {tutorials.filter(t => t.status === 'Approved').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">{t("dashboard:tutorialsPage.drafts")}</div>
            <div className="text-2xl font-bold text-yellow-600">
              {tutorials.filter(t => t.status === 'Draft').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">{t("dashboard:tutorialsPage.pending")}</div>
            <div className="text-2xl font-bold text-blue-600">
              {tutorials.filter(t => t.status === 'Pending').length}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutorials.map((tutorial) => (
            <TutorialCard
              key={tutorial.id}
              tutorial={tutorial}
              onView={() =>
                router.push(`/dashboard/instructor/tutorials/${tutorial.id}/view`)
              }
              onEdit={() =>
                router.push(`/dashboard/instructor/tutorials/${tutorial.id}/edit`)
              }
              onChecklist={() => {
                setChecklistTutorial(tutorial);
                setShowChecklist(true);
              }}
              onSubmit={async () => {
                try {
                  await submitTutorialForReview(tutorial.id);
                  setTutorials((prev) =>
                    prev.map((t) =>
                      t.id === tutorial.id ? { ...t, status: "Pending" } : t
                    )
                  );
                  toast.success(
                    t("dashboard:tutorialsPage.submit_for_review_success")
                  );
                } catch (err) {
                  console.error(err);
                  toast.error(
                    t("dashboard:tutorialsPage.submit_for_review_failed")
                  );
                }
              }}
              onDelete={() => handleDelete(tutorial.id)}
            />
          ))}
        </div>

        {/* No Tutorials */}
        {filteredTutorials.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md mx-auto">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto flex items-center justify-center text-gray-400 mb-4">
                <FaPlus className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t("dashboard:tutorialsPage.no_tutorials")}</h3>
              <p className="text-gray-600 mb-6">
                {t("dashboard:tutorialsPage.no_tutorials_description")}
              </p>
              <button
                onClick={() => router.push("/dashboard/instructor/tutorials/create")}
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-medium py-2 px-6 rounded-xl inline-flex items-center shadow transition-all"
              >
                <FaPlus className="mr-2" /> {t("dashboard:tutorialsPage.create_first_tutorial")}
              </button>
            </div>
          </div>
        )}
      </div>
      <ProgressChecklistModal
        isOpen={showChecklist}
        onClose={() => setShowChecklist(false)}
        tutorial={checklistTutorial}
      />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
      />
    </InstructorLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard", "tutorials"], nextI18NextConfig)),
    },
  };
}