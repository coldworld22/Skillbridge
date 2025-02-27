import { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import useLastSeen from "@/hooks/useLastSeen"; // ✅ Import Hook

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
    <div className="p-4 bg-gray-900 rounded-lg shadow-md">
      <h3 className="text-lg font-bold text-yellow-500">🔵 Active Users</h3>
      <ul className="mt-4 space-y-3">
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
    <li className="flex items-center gap-2 p-2 bg-gray-800 rounded">
      <FaUserCircle className="text-yellow-500 text-xl" />
      <div>
        <span className="text-white">{user.name}</span>
        <p className={`text-sm ${isOnline ? "text-green-400" : "text-gray-400"}`}>
          {lastSeen || "Loading..."}
        </p>
      </div>
    </li>
  );
};

export default ActiveUsers;
