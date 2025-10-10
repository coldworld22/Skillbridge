import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { fetchClassAssignments } from "@/services/classService";
import {
  createClassAssignment,
  deleteClassAssignment,
} from "@/services/instructor/classService";
import { toDateTimeISO } from "@/utils/date";

const initialForm = {
  title: "",
  description: "",
  due_date: "",
};

const computeStatus = (due) => {
  if (!due) return "Ongoing";
  const now = new Date();
  const d = new Date(due);
  return now > d ? "Past Due" : "Ongoing";
};

export default function AssignmentManager({
  classId,
  assignments: initialAssignments = [],
  onAssignmentsUpdate,
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setAssignments(initialAssignments);
  }, [initialAssignments]);

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      try {
        const list = await fetchClassAssignments(classId);
        setAssignments(list);
        onAssignmentsUpdate?.(list);
      } catch (err) {
        console.error("Failed to load assignments", err);
      }
    };
    load();
  }, [classId, onAssignmentsUpdate]);

  const resetForm = () => setForm(initialForm);

  const handleCreateAssignment = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Assignment title is required.");
      return;
    }
    setCreating(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
      };
      if (form.due_date) {
        payload.due_date = toDateTimeISO(form.due_date);
      }
      const assignment = await createClassAssignment(classId, payload);
      setAssignments((prev) => {
        const next = [...prev, assignment];
        onAssignmentsUpdate?.(next);
        return next;
      });
      toast.success("Assignment posted");
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Unable to create assignment");
    } finally {
      setCreating(false);
    }
  };

  const removeAssignment = async (assignmentId) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      await deleteClassAssignment(assignmentId);
      setAssignments((prev) => {
        const next = prev.filter((a) => a.id !== assignmentId);
        onAssignmentsUpdate?.(next);
        return next;
      });
      toast.success("Assignment removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete assignment");
    }
  };

  return (
    <div className="text-sm text-white space-y-4">
      <form onSubmit={handleCreateAssignment} className="space-y-3 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h3 className="text-yellow-300 font-semibold text-base">Create Assignment</h3>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Assignment title"
          className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-yellow-500"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Instructions or notes"
          rows={3}
          className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-yellow-500"
        />
        <input
          type="datetime-local"
          value={form.due_date}
          onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
          className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-yellow-500"
        />
        <button
          type="submit"
          disabled={creating}
          className="w-full bg-yellow-500 text-black py-2 rounded hover:bg-yellow-600 font-semibold disabled:opacity-60"
        >
          {creating ? "Posting..." : "Publish Assignment"}
        </button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-yellow-300">Class Assignments</h3>
          <span className="text-xs text-gray-400">
            {assignments.length === 0 ? "None yet" : `${assignments.length} active`}
          </span>
        </div>
        {assignments.length === 0 ? (
          <p className="text-gray-400">No assignments have been shared with students.</p>
        ) : (
          <ul className="space-y-3">
            {assignments
              .slice()
              .sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0))
              .map((assignment) => (
                <li
                  key={assignment.id}
                  className="bg-gray-800 p-3 rounded border border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-white">{assignment.title}</p>
                    {assignment.due_date && (
                      <p className="text-xs text-gray-400">
                        Due {new Date(assignment.due_date).toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Status: {computeStatus(assignment.due_date)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeAssignment(assignment.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
