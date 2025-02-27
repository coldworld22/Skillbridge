import { FaWhatsapp, FaEnvelope } from "react-icons/fa";

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
    <div className="flex gap-2">
      <button className="px-3 py-2 bg-green-500 text-white rounded flex items-center gap-2" onClick={() => handleInvite("whatsapp")}>
        <FaWhatsapp /> WhatsApp
      </button>
      <button className="px-3 py-2 bg-gray-500 text-white rounded flex items-center gap-2" onClick={() => handleInvite("email")}>
        <FaEnvelope /> Email
      </button>
    </div>
  );
};

export default InviteUser;
