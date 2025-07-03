// ViewTutorialPage.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import InstructorLayout from '@/components/layouts/InstructorLayout';
import { motion } from "framer-motion"; // Smooth animation
import { fetchInstructorTutorialById } from "@/services/instructor/tutorialService";

export default function ViewTutorialPage() {
  const router = useRouter();
  const { id } = router.query;
  const [tutorial, setTutorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [curriculumOpen, setCurriculumOpen] = useState(true); // For mobile accordion

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchInstructorTutorialById(id);
        setTutorial(data?.data || data || null);
      } catch (err) {
        console.error(err);
        setError("Failed to load tutorial");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="p-6">Loading tutorial...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!tutorial) return <div className="p-6">Tutorial not found.</div>;

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
            ← Back to Tutorials
          </button>
        </div>

        {/* Edit Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => router.push(`/dashboard/instructor/tutorials/${tutorial.id}/edit`)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2"
          >
            ✏️ Edit Tutorial
          </button>
        </div>

        {/* Draft Reminder */}
        {tutorial.status === "Draft" && (
          <div className="p-4 bg-yellow-100 text-yellow-700 rounded-lg shadow mb-6">
            📢 This tutorial is currently in <strong>Draft</strong> mode. Complete and submit it for approval!
          </div>
        )}

        {/* Thumbnail */}
        <div className="w-full h-52 sm:h-80 md:h-96 overflow-hidden rounded-2xl shadow-lg">
          <img
            src={tutorial.thumbnail}
            alt={tutorial.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title and Meta */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">{tutorial.title}</h1>
          <div className="flex flex-wrap gap-3 items-center text-xs sm:text-sm text-gray-500">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold
              ${tutorial.status === 'Approved' ? 'bg-green-100 text-green-700' :
                tutorial.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                tutorial.status === 'Draft' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'}`}>
              {tutorial.status}
            </span>
            <span>Last updated: {new Date(tutorial.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">Course Description</h2>
          <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
            {tutorial.shortDescription || "No description provided yet."}
          </p>
        </div>

        {/* Tags */}
        {tutorial.tags && tutorial.tags.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {tutorial.tags.map((tag, idx) => (
                <span key={idx} className="bg-gray-200 px-3 py-1 rounded-full text-xs sm:text-sm text-gray-600">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Curriculum - Accordion */}
        {tutorial.chapters && tutorial.chapters.length > 0 && (
          <div>
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setCurriculumOpen(!curriculumOpen)}>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">Curriculum</h2>
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
                  <div key={index} className="p-4 bg-gray-50 rounded-lg shadow-sm">
                    <h3 className="font-semibold text-gray-800">{chapter.title}</h3>
                    <ul className="mt-2 list-disc list-inside text-gray-600 text-sm sm:text-base">
                      {chapter.lessons.map((lesson, idx) => (
                        <li key={idx}>{lesson}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Media Preview */}
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">Preview</h2>
          {tutorial.preview ? (
            <video controls className="w-full rounded-xl shadow">
              <source src={tutorial.preview} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
              No preview available
            </div>
          )}
        </div>

        {/* Progress (only if Draft) */}
        {tutorial.status === "Draft" && (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">Progress</h2>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-yellow-500 h-3 rounded-full"
                style={{ width: `${tutorial.progress || 40}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{tutorial.progress || 40}% Completed</p>
          </div>
        )}
      </motion.div>
    </InstructorLayout>
  );
}

