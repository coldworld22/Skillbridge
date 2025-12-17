import { useState } from "react";
import styles from "./AdminCommunity.module.scss";
import { Button } from "@/components/ui/button";

export default function TagForm({ initialTag = {}, onSave }) {
  const [name, setName] = useState(initialTag.name || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...initialTag, name });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <input
        type="text"
        placeholder="Tag name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={styles.input}
        required
      />
      <Button type="submit" variant="accent">Save</Button>
    </form>
  );
}
