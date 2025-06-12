import { useState } from "react";
import { useRouter } from "next/router";
import { updateUserProfile } from "@/services/admin/userService";
import { toast } from "react-toastify";

export default function EditUserForm({ user }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    email: user.email || "",
    phone: user.phone || "",
    gender: user.gender || "male",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile(user.id, formData);
      toast.success("User updated successfully");
      router.push("/dashboard/admin/users");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="full_name"
        value={formData.full_name}
        onChange={handleChange}
        placeholder="Full Name"
        className="w-full px-3 py-2 border rounded"
      />
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        className="w-full px-3 py-2 border rounded"
      />
      <input
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="Phone"
        className="w-full px-3 py-2 border rounded"
      />
      <select
        name="gender"
        value={formData.gender}
        onChange={handleChange}
        className="w-full px-3 py-2 border rounded"
      >
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
        <option value="prefer-not-to-say">Prefer not to say</option>
      </select>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}
