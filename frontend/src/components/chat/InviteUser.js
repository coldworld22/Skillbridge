import { FaWhatsapp, FaEnvelope } from "react-icons/fa";
import styles from "./InviteUser.module.scss";

const InviteUser = ({ chat }) => {
  const handleInvite = (method) => {
    const chatURL = `https://yourwebsite.com/chat/${chat.id}`;
    if (method === "email") {
      window.location.href = `mailto:?subject=Join our chat&body=Click here to join: ${chatURL}`;
    } else if (method === "whatsapp") {
      window.open(`https://wa.me/?text=Join our chat: ${chatURL}`, "_blank");
    }
  };

  return (
    <div className={styles.wrapper}>
      <button className={`${styles.button} ${styles.whatsapp}`} onClick={() => handleInvite("whatsapp")} type="button">
        <FaWhatsapp className={styles.icon} /> WhatsApp
      </button>
      <button className={`${styles.button} ${styles.email}`} onClick={() => handleInvite("email")} type="button">
        <FaEnvelope className={styles.icon} /> Email
      </button>
    </div>
  );
};

export default InviteUser;
