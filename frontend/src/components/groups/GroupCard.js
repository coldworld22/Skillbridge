import { useState } from "react";
import groupService from "@/services/groupService";
import toast from "react-hot-toast";
import styles from "./GroupCard.module.scss";

export default function GroupCard({ group }) {
  const [status, setStatus] = useState("idle"); // idle | pending | joined

  const handleJoin = async () => {
    if (status === "pending" || status === "joined") return;
    try {
      const result = await groupService.joinGroup(group.id);
      const isPending = result?.data?.status === "pending";
      setStatus(isPending ? "pending" : "joined");
      const message =
        result?.message ||
        (isPending ? "Join request sent!" : "Joined group successfully!");
      toast.success(message);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to join group"
      );
    }
  };

  const disabled = status === "pending" || status === "joined";
  const label =
    status === "joined"
      ? "Joined"
      : status === "pending"
      ? "Request Sent"
      : "Join Group";

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{group.name}</h2>
      <p className={styles.description}>{group.description}</p>
      <p className={styles.tags}>
        {group.tags?.join(", ")}
      </p>
      <button
        onClick={handleJoin}
        disabled={disabled}
        className={`${styles.button} ${disabled ? styles.disabled : styles.primary}`}
      >
        {label}
      </button>
    </div>
  );
}
