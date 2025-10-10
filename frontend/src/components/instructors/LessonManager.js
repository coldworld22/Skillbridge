import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { fetchClassLessons } from "@/services/classService";
import {
  createClassLesson,
  deleteClassLesson,
} from "@/services/instructor/classService";
import { toDateTimeISO } from "@/utils/date";

const initialForm = {
  title: "",
  start_time: "",
  duration: "",
};

export default function LessonManager({
  classId,
  initialLessons = [],
  onLessonCreated,
  onLessonRemoved,
  onLessonsUpdate,
}) {
  const [lessons, setLessons] = useState(initialLessons);
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLessons(initialLessons);
  }, [initialLessons]);

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const list = await fetchClassLessons(classId);
        setLessons(list);
        onLessonsUpdate?.(list);
      } catch (err) {
        console.error("Failed to load lessons", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [classId, onLessonsUpdate]);

  const resetForm = () => setForm(initialForm);

  const handleCreateLesson = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.start_time) {
      toast.error("Provide a lesson title and start time.");
      return;
    }
    setCreating(true);
    try {
      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("start_time", toDateTimeISO(form.start_time));
      if (form.duration) payload.append("duration", form.duration.trim());
      const lesson = await createClassLesson(classId, payload);
      setLessons((prev) => {
        const next = [...prev, lesson];
        onLessonsUpdate?.(next);
        return next;
      });
      onLessonCreated?.(lesson);
      toast.success("Lesson scheduled");
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Unable to create lesson");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Remove this lesson?")) return;
    try {
      await deleteClassLesson(lessonId);
      setLessons((prev) => {
        const next = prev.filter((lesson) => lesson.id !== lessonId);
        onLessonsUpdate?.(next);
        return next;
      });
      onLessonRemoved?.(lessonId);
      toast.success("Lesson removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete lesson");
    }
  };

  const computeStatus = (lesson) => {
    if (lesson.cancelled) return "Cancelled";
    const now = new Date();
    const start = lesson.start_time ? new Date(lesson.start_time) : null;
    const end = lesson.end_time ? new Date(lesson.end_time) : null;
    if (start && end) {
      if (now < start) return "Upcoming";
      if (now >= start && now <= end) return "Ongoing";
      if (now > end) return "Completed";
    }
    if (start) {
      if (now < start) return "Upcoming";
      if (now >= start) return "Completed";
    }
    return "Ongoing";
  };

  return (
    <div className="text-sm text-white space-y-4">
      <form onSubmit={handleCreateLesson} className="space-y-3 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h3 className="text-yellow-300 font-semibold text-base">Schedule a Lesson</h3>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Lesson title"
          className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-yellow-500"
        />
        <input
          type="datetime-local"
          value={form.start_time}
          onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
          className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-yellow-500"
        />
        <input
          type="text"
          value={form.duration}
          onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}
          placeholder="Duration (e.g., 60 minutes)"
          className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-yellow-500"
        />
        <button
          type="submit"
          disabled={creating}
          className="w-full bg-yellow-500 text-black py-2 rounded hover:bg-yellow-600 font-semibold disabled:opacity-60"
        >
          {creating ? "Saving..." : "Add Lesson"}
        </button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-yellow-300">Upcoming & Past Lessons</h3>
          {isLoading && <span className="text-xs text-gray-400">Loading...</span>}
        </div>
        {lessons.length === 0 ? (
          <p className="text-gray-400">No lessons have been scheduled yet.</p>
        ) : (
          <ul className="space-y-3">
            {lessons
              .slice()
              .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
              .map((lesson) => {
                const status = computeStatus(lesson);
                return (
                  <li key={lesson.id} className="bg-gray-800 p-3 rounded border border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{lesson.title}</p>
                      {lesson.start_time && (
                        <p className="text-xs text-gray-400">
                          {new Date(lesson.start_time).toLocaleString()}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">Status: {status}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </div>
  );
}
