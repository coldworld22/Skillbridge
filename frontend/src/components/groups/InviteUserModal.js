import { useState } from "react";
import { FaSearch, FaUserPlus, FaEnvelope, FaVideo, FaPhone } from "react-icons/fa";
import logger from "@/utils/logger";
import { Button } from "@/components/ui/button";
import modalStyles from "@/components/common/Modal.module.scss";

export default function InviteUserModal({ groupId, onClose }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    // Mock invite send (replace with real logic later)
    logger.log(`📨 Invite sent to ${email} for group ${groupId}`);
    setSent(true);
    setTimeout(onClose, 1000); // auto close after 1s
  };

  return (
    <div className={modalStyles.simpleOverlay}>
      <div className={modalStyles.panel}>
        <div className={modalStyles.headerRow}>
          <h2 className={modalStyles.title}>Invite User</h2>
          <button onClick={onClose} className={modalStyles.closeButton} aria-label="Close">
            ✕
          </button>
        </div>
        <div className={modalStyles.field}>
          <label className={modalStyles.mutedSmall}>User email</label>
          <div className={modalStyles.inputRow}>
            <FaSearch className={modalStyles.inputIcon} />
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={modalStyles.textInput}
            />
          </div>
        </div>
        <div className={modalStyles.ctaRow}>
          <Button variant="neutral" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" onClick={handleSend} disabled={!email}>
            {sent ? "Sent!" : "Send Invite"}
          </Button>
        </div>
        <div className={modalStyles.divider}></div>
        <div className={modalStyles.mutedSmall}>Share via</div>
        <div className={modalStyles.pillButtons} style={{ marginTop: "0.5rem" }}>
          <Button variant="ghost" className={modalStyles.pillButton}>
            <FaEnvelope /> Email
          </Button>
          <Button variant="ghost" className={modalStyles.pillButton}>
            <FaVideo /> Video Call
          </Button>
          <Button variant="ghost" className={modalStyles.pillButton}>
            <FaPhone /> WhatsApp
          </Button>
          <Button variant="ghost" className={modalStyles.pillButton}>
            <FaUserPlus /> Invite link
          </Button>
        </div>
      </div>
    </div>
  );
}
