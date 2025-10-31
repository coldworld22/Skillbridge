// ViewTutorialPage.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
import InstructorLayout from '@/components/layouts/InstructorLayout';
import { motion } from "framer-motion"; // Smooth animation
import {
  FaEdit,
  FaDownload,
  FaRegEye,
  FaUsers,
  FaStar,
  FaRegComments,
} from "react-icons/fa";
import CustomVideoPlayer from "@/components/shared/CustomVideoPlayer";
import { safeEncodeURI } from "@/utils/url";
import ProgressChecklistModal from '@/components/tutorials/ProgressChecklistModal';
import ConfirmModal from "@/components/common/ConfirmModal";
import { toast } from "react-toastify";
import { fetchInstructorTutorialById, submitTutorialForReview, deleteInstructorTutorial } from "@/services/instructor/tutorialService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

export default function ViewTutorialPage() {
  const router = useRouter();
  const { t } = useTranslation(["common", "dashboard", "tutorials"]);
  const { id } = router.query;
  const [tutorial, setTutorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [curriculumOpen, setCurriculumOpen] = useState(true); // For mobile accordion
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
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchInstructorTutorialById(id);
        setTutorial(data?.data || data || null);
      } catch (err) {
        console.error(err);
        setError(t("tutorials:detail.load_error"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="p-6">{t("dashboard:tutorialViewPage.loading")}</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!tutorial) return <div className="p-6">{t("dashboard:tutorialViewPage.not_found")}</div>;

  return (
    <InstructorLayout>
      <motion.div
        className="p-6 space-y-8 max-w-5xl mx-auto" 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => router.push("/dashboard/instructor/tutorials")}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
          >
            ← {t("dashboard:tutorialViewPage.back_to_tutorials")}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-end mb-6 gap-2">
          <button
            onClick={() => router.push(`/dashboard/instructor/tutorials/${tutorial.id}/edit`)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2"
          >
            ✏️ {t("dashboard:tutorialViewPage.edit_tutorial")}
          </button>
          <button
            onClick={() => setShowChecklist(true)}
            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-4 py-2 rounded-md font-semibold flex items-center gap-2"
          >
            📋 {t("dashboard:tutorialViewPage.checklist")}
          </button>
          <button
            onClick={() => router.push(`/dashboard/instructor/tutorials/${tutorial.id}/analytics`)}
            className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-4 py-2 rounded-md font-semibold flex items-center gap-2"
          >
            📈 {t("dashboard:tutorialViewPage.analytics")}
          </button>
          <button
            onClick={async () => {
              if (!window.confirm(t('dashboard:tutorialViewPage.delete_confirm'))) return;
              try {
                await deleteInstructorTutorial(tutorial.id);
                router.push('/dashboard/instructor/tutorials');
              } catch (err) {
                console.error(err);
                alert(t('dashboard:tutorialViewPage.delete_failed'));
              }
            }}
            className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md font-semibold flex items-center gap-2"
          >
            🗑 {t("dashboard:tutorialViewPage.delete")}
          </button>
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tutorial, null, 2));
              const a = document.createElement("a");
              a.href = dataStr;
              a.download = `${tutorial.slug || tutorial.id}.json`;
              document.body.appendChild(a);
              a.click();
              a.remove();
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold flex items-center gap-2"
          >
            <FaDownload /> {t("dashboard:tutorialViewPage.export")}
          </button>
        </div>

        {/* Draft Reminder */}
        {tutorial.status === "Draft" && (
          <div className="p-4 bg-yellow-100 text-yellow-700 rounded-lg shadow mb-6">
            {t("dashboard:tutorialViewPage.draft_notice")}
          </div>
        )}

        {/* Thumbnail */}
        <div className="w-full h-52 sm:h-80 md:h-96 overflow-hidden rounded-2xl shadow-lg">
          {tutorial.thumbnail ? (
            <Image
              src={safeEncodeURI(tutorial.thumbnail)}
              alt={tutorial.title || t("dashboard:tutorialViewPage.untitled", { defaultValue: "Untitled tutorial" })}
              width={1280}
              height={720}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm sm:text-base">
              {t("dashboard:tutorialViewPage.no_thumbnail", {
                defaultValue: "No cover image uploaded yet.",
              })}
            </div>
          )}
        </div>

        {/* Title and Meta */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">{tutorial.title}</h1>
          <div className="flex flex-wrap gap-3 items-center text-xs sm:text-sm text-gray-500">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold
              ${tutorial.status === 'Approved' ? 'bg-green-100 text-green-700' :
                tutorial.status === 'Pending' ? 'bg-blue-100 text-blue-700' :
                tutorial.status === 'Draft' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'}`}>
              {t(`dashboard:tutorialsPage.status_label.${tutorial.status.toLowerCase()}`)}
            </span>
            <span>{t("dashboard:tutorialViewPage.last_updated", { date: new Date(tutorial.updatedAt).toLocaleDateString() })}</span>
            {tutorial.createdAt && (
              <span>{t("dashboard:tutorialViewPage.created", { date: new Date(tutorial.createdAt).toLocaleDateString() })}</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">{t("dashboard:tutorialViewPage.course_description")}</h2>
          <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
            {tutorial.description || tutorial.shortDescription ||
              t("dashboard:tutorialViewPage.no_description")}
          </p>
        </div>

        {/* Tags */}
        {tutorial.tags && tutorial.tags.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">{t("dashboard:tutorialViewPage.tags")}</h2>
            <div className="flex flex-wrap gap-2">
              {tutorial.tags.map((tag, idx) => (
                <span key={idx} className="bg-gray-200 px-3 py-1 rounded-full text-xs sm:text-sm text-gray-600">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {tutorial.status === "Approved" && (
          <div className="grid grid-cols-4 gap-4 text-center mt-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FaRegEye className="mx-auto text-blue-500" />
              <span className="text-xs mt-1">{tutorial.views}</span>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <FaUsers className="mx-auto text-green-500" />
              <span className="text-xs mt-1">{tutorial.enrollments}</span>
            </div>
            <div className="p-2 bg-yellow-50 rounded-lg">
              <FaStar className="mx-auto text-yellow-500" />
              <span className="text-xs mt-1">{tutorial.rating || 'N/A'}</span>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <FaRegComments className="mx-auto text-purple-500" />
              <span className="text-xs mt-1">{tutorial.comments}</span>
            </div>
          </div>
        )}

        {/* Curriculum - Accordion */}
        {tutorial.chapters && tutorial.chapters.length > 0 && (
          <div>
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setCurriculumOpen(!curriculumOpen)}>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">{t("dashboard:tutorialViewPage.curriculum")}</h2>
              <span className="text-gray-500">{curriculumOpen ? '−' : '+'}</span>
            </div>
            {curriculumOpen && (
              <motion.div
                className="space-y-3 mt-4"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {tutorial.chapters.map((chapter, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg shadow-sm space-y-1"
                  >
                    <h3 className="font-semibold text-gray-800">
                      {chapter.title}
                      {chapter.duration ? ` (${t("dashboard:tutorialViewPage.minutes", { count: chapter.duration })})` : ""}
                    </h3>
                    {chapter.content && (
                      <p className="text-gray-600 text-sm sm:text-base">
                        {chapter.content}
                      </p>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Media Preview */}
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">{t("dashboard:tutorialViewPage.preview")}</h2>
          {tutorial.preview ? (
            <CustomVideoPlayer
              videos={[{ src: safeEncodeURI(tutorial.preview) }]}
              storageKey={tutorial?.id ? `instructor-tutorial-${tutorial.id}` : undefined}
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
              {t("dashboard:tutorialViewPage.no_preview")}
            </div>
          )}
        </div>

        {/* Progress (only if Draft) */}
        {tutorial.status === "Draft" && (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">{t("dashboard:tutorialViewPage.progress")}</h2>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-yellow-500 h-3 rounded-full"
                style={{ width: `${tutorial.progress || 40}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("dashboard:tutorialViewPage.completed_percent", { percent: tutorial.progress || 40 })}</p>
            {tutorial.progress === 100 && (
              <button
                onClick={async () => {
                  try {
                    await submitTutorialForReview(tutorial.id);
                    setTutorial({ ...tutorial, status: "Pending" });
                    toast.success(
                      t("tutorialCreatePage.submit_success", {
                        defaultValue:
                          "Tutorial submitted successfully! Waiting for admin approval.",
                      })
                    );
                  } catch (err) {
                    console.error(err);
                    toast.error(
                      t("tutorialViewPage.submit_failed", {
                        defaultValue: "Failed to submit tutorial",
                      })
                    );
                  }
                }}
                className="mt-3 bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 px-3 rounded-md text-sm"
              >
                🚀 {t("dashboard:tutorialViewPage.submit_for_review")}
              </button>
            )}
          </div>
        )}

        {tutorial.status === "Rejected" && tutorial.rejection_reason && (
          <div className="mt-4 bg-red-50 text-red-700 px-3 py-2 rounded-lg">
            {t("dashboard:tutorialViewPage.rejection_reason", { reason: tutorial.rejection_reason })}
          </div>
        )}

        {tutorial.status === "Pending" && (
          <div className="mt-4 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
            ⏳ {t("dashboard:tutorialViewPage.pending_approval")}
          </div>
        )}
      </motion.div>
      <ProgressChecklistModal
        isOpen={showChecklist}
        onClose={() => setShowChecklist(false)}
        tutorial={tutorial}
      />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={closeConfirmModal}
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
