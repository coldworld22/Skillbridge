import { useState } from "react";
import { useRouter } from "next/router";
import { createUser } from "@/services/admin/userService";
import { toast } from "react-toastify";
import styles from "./AddUserForm.module.scss";
import { Button } from "@/components/ui/button";

export default function AddUserForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "student",
    gender: "male",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUser(formData);
      toast.success("User created successfully");
      router.push("/dashboard/admin/users");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create user");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input
        name="full_name"
        value={formData.full_name}
        onChange={handleChange}
        placeholder="Full Name"
        className={styles.input}
      />
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        className={styles.input}
      />
      <input
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="Phone"
        className={styles.input}
      />
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Password"
        className={styles.input}
      />
      <select
        name="role"
        value={formData.role}
        onChange={handleChange}
        className={styles.select}
      >
        <option value="admin">Admin</option>
        <option value="instructor">Instructor</option>
        <option value="student">Student</option>
      </select>
      <select
        name="gender"
        value={formData.gender}
        onChange={handleChange}
        className={styles.select}
      >
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
        <option value="prefer-not-to-say">Prefer not to say</option>
      </select>
      <div className={styles.actions}>
        <Button
          type="button"
          onClick={() => router.back()}
          variant="neutral"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="accent"
        >
          Save User
        </Button>
      </div>
    </form>
  );
}
