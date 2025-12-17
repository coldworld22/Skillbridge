import { useState } from "react";
import styles from "./RoleSelection.module.scss";

const RoleSelection = ({ formData, setFormData, onNext }) => {
  const [role, setRole] = useState(formData.role || ""); // Store role state

  const handleNext = () => {
    if (!role) return alert("Please select a role");
    setFormData({ ...formData, role }); // Store role in formData
    onNext(role === "student" ? 4 : 5); // ✅ Skip to the correct details step
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Select Your Role</h2>
      <div className={styles.options}>
        <button
          className={`${styles.option} ${role === "student" ? styles.selectedStudent : ""}`}
          onClick={() => setRole("student")}
          type="button"
        >
          Student
        </button>
        <button
          className={`${styles.option} ${role === "instructor" ? styles.selectedInstructor : ""}`}
          onClick={() => setRole("instructor")}
          type="button"
        >
          Instructor
        </button>
      </div>
      <button className={styles.next} onClick={handleNext} type="button">
        Next
      </button>
    </div>
  );
};

export default RoleSelection;
