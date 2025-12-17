import { useState } from "react";
import styles from "./AdminCommunity.module.scss";
import { Button } from "@/components/ui/button";

export default function AnnouncementForm({ onPost }) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    onPost(message.trim());
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className={`${styles.card} ${styles.form}`}>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Post a new announcement..."
        rows={3}
        className={styles.textarea}
        required
      />
      <div className="flex justify-end">
        <Button type="submit" variant="accent">
          Post
        </Button>
      </div>
    </form>
  );
}
