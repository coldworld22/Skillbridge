import { useState, useEffect } from "react";
import { createClassAssignment, deleteClassAssignment } from "@/services/instructor/classService";
import { fetchClassAssignments } from "@/services/classService";
import { toDateInput } from "@/utils/date";

export default function AssignmentManager({ classId, initialAssignments = [] }) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Sync when parent provides new assignments
  useEffect(() => {
    setAssignments(initialAssignments);
  }, [initialAssignments]);

  // Load assignments when class changes
  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      try {
        const list = await fetchClassAssignments(classId);
        setAssignments(list);
      } catch (err) {
        console.error("Failed to load assignments", err);
      }
    };
    load();
  }, [classId]);

  const addAssignment = async () => {
    if (!title) return;
    try {
      const payload = {
        title,
        description,
        due_date: dueDate || null,
      };
      const assignment = await createClassAssignment(classId, payload);
      setAssignments([...assignments, assignment]);
      setTitle("");
      setDescription("");
      setDueDate("");
    } catch (err) {
      console.error("Failed to create assignment", err);
    }
  };

  const removeAssignment = async (index) => {
    const assignment = assignments[index];
    try {
      await deleteClassAssignment(assignment.id);
      setAssignments(assignments.filter((_, i) => i !== index));
    } catch (err) {
      console.error("Failed to delete assignment", err);
    }
  };

  return (
    <div className="text-sm text-white">
      <div className="mb-4 space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Assignment title"
          className="w-full px-3 py-2 rounded bg-gray-700 text-white"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full px-3 py-2 rounded bg-gray-700 text-white"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-3 py-2 rounded bg-gray-700 text-white"
        />
        <button
          onClick={addAssignment}
          className="w-full bg-yellow-500 text-black py-2 rounded hover:bg-yellow-600 font-semibold"
        >
          Add Assignment
        </button>
      </div>

      <ul className="space-y-3">
        {assignments.map((a, i) => (
          <li
            key={a.id}
            className="bg-gray-700 p-3 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{a.title}</p>
              {a.due_date && (
                <p className="text-gray-400 text-xs">
                  Due: {toDateInput(a.due_date)}
                </p>
              )}
            </div>
            <button
              onClick={() => removeAssignment(i)}
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
