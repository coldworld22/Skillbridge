// components/instructor/LessonManager.js
import { useState, useEffect } from "react";
import { fetchClassLessons } from "@/services/classService";
export default function LessonManager({ classId, initialLessons = [] }) {
  const [lessons, setLessons] = useState(initialLessons);

  // Sync lessons when parent provides new list from backend
  useEffect(() => {
    setLessons(initialLessons);
  }, [initialLessons]);

  // Load lessons from API when classId changes
  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      try {
        const list = await fetchClassLessons(classId);
        setLessons(list);
      } catch (err) {
        console.error("Failed to load lessons", err);
      }
    };
    load();
  }, [classId]);

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
    <div className="text-sm text-white space-y-3">
      {lessons.map((lesson, i) => {
        const status = computeStatus(lesson);
        return (
          <div key={i} className="bg-gray-700 p-3 rounded">
            <p className="font-medium">
              {i + 1}. {lesson.title}
            </p>
            {lesson.start_time && (
              <p className="text-gray-400 text-xs">
                {new Date(lesson.start_time).toLocaleString()}
              </p>
            )}
            <p className="text-xs">Status: {status}</p>
          </div>
        );
      })}
    </div>
  );
}
