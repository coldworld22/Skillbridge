import { useState } from "react";
import groupService from "@/services/groupService";
import toast from "react-hot-toast";

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
    <div className="border p-4 rounded shadow bg-white space-y-2">
      <h2 className="text-lg font-bold">{group.name}</h2>
      <p className="text-gray-600">{group.description}</p>
      <p className="text-sm text-blue-600">
        {group.tags?.join(", ")}
      </p>
      <button
        onClick={handleJoin}
        disabled={disabled}
        className={`px-4 py-2 rounded ${
          disabled ? "bg-gray-400" : "bg-blue-600 text-white"
        }`}
      >
        {label}
      </button>
    </div>
  );
}
