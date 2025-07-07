import { useState } from "react";

const RoleSelection = ({ formData, setFormData, onNext }) => {
  const [role, setRole] = useState(formData.role || ""); // Store role state

  const handleNext = () => {
    if (!role) return alert("Please select a role");
    setFormData({ ...formData, role }); // Store role in formData
    onNext(role === "student" ? 4 : 5); // ✅ Skip to the correct details step
  };

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-yellow-500">Select Your Role</h2>
      <div className="flex gap-4">
        <button
          className={`p-4 border rounded-lg ${role === "student" ? "bg-blue-500 text-white" : "bg-gray-700"}`}
          onClick={() => setRole("student")}
        >
          Student
        </button>
        <button
          className={`p-4 border rounded-lg ${role === "instructor" ? "bg-green-500 text-white" : "bg-gray-700"}`}
          onClick={() => setRole("instructor")}
        >
          Instructor
        </button>
      </div>
      <button className="mt-4 bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-600 transition" onClick={handleNext}>
        Next
      </button>
    </div>
  );
};

export default RoleSelection;
