import { useState } from "react";
import { FaSearch, FaUserCheck, FaFilter, FaTimes } from "react-icons/fa";

const users = [
  { id: 1, name: "John Doe", reputation: 320, expertise: "React", availability: ["text", "video"] },
  { id: 2, name: "Emma Wilson", reputation: 210, expertise: "MySQL", availability: ["text", "audio"] },
  { id: 3, name: "Alice Brown", reputation: 180, expertise: "Python", availability: ["text"] },
  { id: 4, name: "Robert Smith", reputation: 250, expertise: "Node.js", availability: ["video"] },
];

const UserFilter = ({ onInvite }) => {
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Handle Search & Filter
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);
    setFilteredUsers(users.filter((user) => user.name.toLowerCase().includes(query) || user.expertise.toLowerCase().includes(query)));
  };

  // Invite a User
  const handleInvite = (user) => {
    if (!selectedUsers.includes(user)) {
      setSelectedUsers([...selectedUsers, user]);
      onInvite(user);
    }
  };

  // Remove Invited User
  const removeInvite = (user) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-bold text-yellow-500 mb-3">🎯 Invite Experts to Answer</h3>

      {/* ✅ Search & Filter */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name or expertise..."
          value={search}
          onChange={handleSearch}
          className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none"
        />
        <FaSearch className="absolute right-3 top-4 text-gray-400" />
      </div>

      {/* ✅ User List */}
      <div className="mt-4 max-h-40 overflow-y-auto">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div key={user.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg mb-2">
              <div>
                <p className="text-white font-bold">{user.name}</p>
                <p className="text-gray-400 text-sm">⭐ Reputation: {user.reputation} | 📚 {user.expertise}</p>
              </div>
              <button
                className="px-3 py-1 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 flex items-center gap-2"
                onClick={() => handleInvite(user)}
              >
                <FaUserCheck /> Invite
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-400 mt-2">No users found.</p>
        )}
      </div>

      {/* ✅ Invited Users */}
      {selectedUsers.length > 0 && (
        <div className="mt-4">
          <h4 className="text-yellow-400">Invited Users:</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedUsers.map((user) => (
              <span key={user.id} className="flex items-center bg-gray-700 text-white px-3 py-1 rounded-lg">
                {user.name} <FaTimes className="ml-2 cursor-pointer text-red-500" onClick={() => removeInvite(user)} />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFilter;
