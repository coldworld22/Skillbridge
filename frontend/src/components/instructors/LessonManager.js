// components/instructor/LessonManager.js
import { useState } from "react";
import { createClassLesson, deleteClassLesson } from "@/services/instructor/classService";
export default function LessonManager({ classId, initialLessons = [] }) {
  const [lessons, setLessons] = useState(initialLessons);
  const [newTitle, setNewTitle] = useState("");
  const [newDuration, setNewDuration] = useState("");

  const addLesson = async () => {
    if (!newTitle) return;
    try {
      const lesson = await createClassLesson(classId, { title: newTitle });
      setLessons([...lessons, lesson]);
      setNewTitle("");
      setNewDuration("");
    } catch (err) {
      console.error("Failed to create lesson", err);
    }
  };

  const removeLesson = async (index) => {
    const lesson = lessons[index];
    try {
      await deleteClassLesson(lesson.id);
      setLessons(lessons.filter((_, i) => i !== index));
    } catch (err) {
      console.error("Failed to delete lesson", err);
    }
  };

  return (
    <div className="text-sm text-white">
      <div className="mb-4 space-y-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Lesson title"
          className="w-full px-3 py-2 rounded bg-gray-700 text-white"
        />
        <input
          type="text"
          value={newDuration}
          onChange={(e) => setNewDuration(e.target.value)}
          placeholder="Duration (e.g., 20 min)"
          className="w-full px-3 py-2 rounded bg-gray-700 text-white"
        />
        <button
          onClick={addLesson}
          className="w-full bg-yellow-500 text-black py-2 rounded hover:bg-yellow-600 font-semibold"
        >
          Add Lesson
        </button>
      </div>

      <ul className="space-y-3">
        {lessons.map((lesson, i) => (
          <li
            key={i}
            className="bg-gray-700 p-3 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{i + 1}. {lesson.title}</p>
              <p className="text-gray-400 text-xs">Duration: {lesson.duration}</p>
            </div>
            <button
              onClick={() => removeLesson(i)}
              className="text-red-400 hover:underline text-xs"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
