import { useState, useEffect } from "react";
import { deleteClassAssignment } from "@/services/instructor/classService";
import { fetchClassAssignments } from "@/services/classService";
import { toDateInput } from "@/utils/date";

const computeStatus = (due) => {
  if (!due) return "Ongoing";
  const now = new Date();
  const d = new Date(due);
  return now > d ? "Past Due" : "Ongoing";
};

export default function AssignmentManager({ classId, initialAssignments = [] }) {
  const [assignments, setAssignments] = useState(initialAssignments);

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
      {assignments.length > 0 && (
        <div className="bg-yellow-500 text-black p-2 rounded mb-3 text-center text-xs font-semibold">
          📋 {assignments.length} assignment{assignments.length > 1 ? 's' : ''} posted
        </div>
      )}
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
              <p className="text-gray-400 text-xs">Status: {computeStatus(a.due_date)}</p>
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
