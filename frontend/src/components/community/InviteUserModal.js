import { useState } from "react";
import { FaTimes, FaSearch, FaEnvelope, FaPhone, FaVideo, FaUserPlus } from "react-icons/fa";

const InviteUserModal = ({ onClose }) => {
  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // Mock User List
  const users = [
    { id: 1, name: "John Doe", rating: 4.8, expertise: "React", contact: "john@example.com", availability: ["chat", "video"] },
    { id: 2, name: "Emma Wilson", rating: 4.5, expertise: "MySQL", contact: "emma@example.com", availability: ["chat"] },
    { id: 3, name: "Michael Lee", rating: 4.9, expertise: "AI", contact: "michael@example.com", availability: ["video", "email"] },
  ];

  // Filter Users Based on Search
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.expertise.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg">
        
        {/* ✅ Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">🔍 Invite a User</h2>
          <button className="text-gray-400 hover:text-white" onClick={onClose}>
            <FaTimes size={20} />
          </button>
        </div>

        {/* ✅ Search Users */}
        <div className="mt-4">
          <label className="block text-gray-300">Search User</label>
          <div className="flex items-center bg-gray-700 p-2 rounded-lg">
            <FaSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              className="w-full bg-transparent focus:outline-none text-white"
              placeholder="Search by name or expertise..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        {/* ✅ User List */}
        <div className="mt-4 max-h-60 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div 
                key={user.id} 
                className={`p-3 rounded-lg flex justify-between items-center cursor-pointer ${selectedUser?.id === user.id ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-white"} hover:bg-yellow-500 transition`}
                onClick={() => setSelectedUser(user)}
              >
                <div>
                  <h3 className="font-bold">{user.name}</h3>
                  <p className="text-sm">⭐ {user.rating} | {user.expertise}</p>
                </div>
                <FaUserPlus />
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center">No users found.</p>
          )}
        </div>

        {/* ✅ Contact Options */}
        {selectedUser && (
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-lg font-bold">Contact {selectedUser.name}</h3>
            <p className="text-sm text-gray-300">Choose how you want to invite:</p>
            <div className="flex gap-4 mt-3">
              {selectedUser.availability.includes("chat") && (
                <button className="p-2 bg-blue-600 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
                  <FaEnvelope /> Chat
                </button>
              )}
              {selectedUser.availability.includes("video") && (
                <button className="p-2 bg-green-600 rounded-lg flex items-center gap-2 hover:bg-green-700 transition">
                  <FaVideo /> Video Call
                </button>
              )}
              <button className="p-2 bg-yellow-500 text-gray-900 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition">
                <FaPhone /> WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* ✅ Confirm Invite Button */}
        <div className="mt-6 flex justify-end">
          <button 
            className="px-6 py-2 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-600"
            disabled={!selectedUser}
          >
            Send Invite
          </button>
        </div>

      </div>
    </div>
  );
};

export default InviteUserModal;
