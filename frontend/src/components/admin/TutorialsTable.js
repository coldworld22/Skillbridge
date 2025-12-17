// components/admin/tutorials/TutorialsTable.js
import { FaCheck, FaTimes, FaTrash, FaEye } from "react-icons/fa";
import styles from "./TutorialsTable.module.scss";

const tutorials = [
  {
    id: 1,
    title: "React Basics",
    instructor: "John Doe",
    category: "Frontend",
    price: "$25",
    status: "Pending",
  },
  {
    id: 2,
    title: "Mastering Python",
    instructor: "Sara Lee",
    category: "Backend",
    price: "Free",
    status: "Approved",
  },
  {
    id: 3,
    title: "UI/UX Design",
    instructor: "Ali Khan",
    category: "Design",
    price: "$15",
    status: "Rejected",
  },
];

export default function TutorialsTable() {
  return (
    <div className={`${styles.card} ${styles.spaced}`}>
      <h2 className={styles.header}>📚 All Tutorials</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Title</th>
              <th className={styles.th}>Instructor</th>
              <th className={styles.th}>Category</th>
              <th className={styles.th}>Price</th>
              <th className={styles.th}>Status</th>
              <th className={`${styles.th} ${styles.right}`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tutorials.map((tut) => (
              <tr key={tut.id} className={styles.row}>
                <td className={styles.td}>{tut.title}</td>
                <td className={styles.td}>{tut.instructor}</td>
                <td className={styles.td}>{tut.category}</td>
                <td className={styles.td}>{tut.price}</td>
                <td className={styles.td}>
                  <span
                    className={`${styles.status} ${
                      tut.status === "Approved"
                        ? styles.approved
                        : tut.status === "Pending"
                        ? styles.pending
                        : styles.rejected
                    }`}
                  >
                    {tut.status}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.right}`}>
                  <div className={styles.actions}>
                  <button title="View" className={styles.actionButton}>
                    <FaEye />
                  </button>
                  <button title="Approve" className={styles.actionButton}>
                    <FaCheck />
                  </button>
                  <button title="Reject" className={styles.actionButton}>
                    <FaTimes />
                  </button>
                  <button title="Delete" className={styles.actionButton}>
                    <FaTrash />
                  </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
