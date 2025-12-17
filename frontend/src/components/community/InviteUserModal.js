import { useState } from "react";
import { FaTimes, FaSearch, FaEnvelope, FaPhone, FaVideo, FaUserPlus } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import modalStyles from "@/components/common/Modal.module.scss";

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
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.expertise.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className={modalStyles.simpleOverlay}>
      <div className={modalStyles.panel} style={{ maxWidth: "34rem" }}>
        <div className={modalStyles.headerRow}>
          <h2 className={modalStyles.title}>🔍 Invite a User</h2>
          <button
            className={modalStyles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <div className={modalStyles.field}>
          <label className={modalStyles.mutedSmall}>Search User</label>
          <div className={modalStyles.inputRow}>
            <FaSearch className={modalStyles.inputIcon} />
            <input
              type="text"
              className={modalStyles.textInput}
              placeholder="Search by name or expertise..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        <div className={modalStyles.list} style={{ marginTop: "0.75rem" }}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`${modalStyles.listItem} ${
                  selectedUser?.id === user.id ? modalStyles.listItemActive : ""
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <div>
                  <div className={modalStyles.listItemTitle}>{user.name}</div>
                  <p className={modalStyles.mutedSmall}>
                    ⭐ {user.rating} | {user.expertise}
                  </p>
                </div>
                <FaUserPlus />
              </div>
            ))
          ) : (
            <p className={`${modalStyles.mutedSmall} ${modalStyles.mutedSmall} `}>
              No users found.
            </p>
          )}
        </div>

        {selectedUser && (
          <div className={modalStyles.section}>
            <h3 className={modalStyles.subtitle}>
              Contact {selectedUser.name}
            </h3>
            <p className={modalStyles.mutedSmall}>
              Choose how you want to invite:
            </p>
            <div className={modalStyles.pillButtons} style={{ marginTop: "0.75rem" }}>
              {selectedUser.availability.includes("chat") && (
                <Button variant="accent" className={modalStyles.pillButton}>
                  <FaEnvelope /> Chat
                </Button>
              )}
              {selectedUser.availability.includes("video") && (
                <Button variant="secondary" className={modalStyles.pillButton}>
                  <FaVideo /> Video Call
                </Button>
              )}
              <Button variant="ghost" className={modalStyles.pillButton}>
                <FaPhone /> WhatsApp
              </Button>
            </div>
          </div>
        )}

        <div className={modalStyles.ctaRow}>
          <Button variant="neutral" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="accent"
            disabled={!selectedUser}
            onClick={() => selectedUser && onClose?.()}
          >
            Send Invite
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InviteUserModal;
