import { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import useLastSeen from "@/hooks/useLastSeen"; // ✅ Import Hook
import styles from "./ActiveUsers.module.scss";

const ActiveUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Simulated API call (Replace with real API request)
    setUsers([
      { id: 1, name: "John Doe" },
      { id: 2, name: "Jane Smith" },
      { id: 3, name: "Instructor Mike" },
    ]);
  }, []);

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>🔵 Active Users</h3>
      <ul className={styles.list}>
        {users.map((user) => (
          <UserStatus key={user.id} user={user} />
        ))}
      </ul>
    </div>
  );
};

// ✅ Move Hook Call Inside a Separate Component
const UserStatus = ({ user }) => {
  const { lastSeen, isOnline } = useLastSeen(user.id);

  return (
    <li className={styles.item}>
      <FaUserCircle className={styles.icon} />
      <div>
        <span className={styles.name}>{user.name}</span>
        <p className={`${styles.status} ${isOnline ? styles.online : ""}`}>
          {lastSeen || "Loading..."}
        </p>
      </div>
    </li>
  );
};

export default ActiveUsers;
