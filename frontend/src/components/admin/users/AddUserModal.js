import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AddUserModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "student",
    status: "active",
    avatar: null,
    gender: "male",
  });

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        full_name: "",
        email: "",
        role: "student",
        status: "active",
        avatar: null,
        gender: "male",
      });
      setPreview(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar" && files[0]) {
      setFormData({ ...formData, avatar: files[0] });
      setPreview(URL.createObjectURL(files[0]));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async () => {
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.phone.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      toast.success("User added successfully.");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 id="modal-title" className="text-xl font-bold mb-4">Add New User</h2>

        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={formData.full_name}
          onChange={handleChange}
          className="w-full border p-2 mb-3 rounded"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border p-2 mb-3 rounded"
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full border p-2 mb-3 rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full border p-2 mb-3 rounded"
        />

        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full border p-2 mb-3 rounded"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="Admin">Admin</option>
          <option value="Instructor">Instructor</option>
          <option value="Student">Student</option>
        </select>



        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full border p-2 mb-4 rounded"
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>

        </select>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Avatar (optional)</label>
          <input
            type="file"
            name="avatar"
            accept="image/*"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          {preview && (
            <img src={preview} alt="Preview" className="mt-3 w-24 h-24 object-cover rounded-full" />
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
