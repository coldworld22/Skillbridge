// components/admin/security/MessageFlagLog.js
import { useEffect, useMemo, useState } from "react";
import {
  fetchFlaggedMessages,
  updateFlaggedMessageStatus,
} from "@/services/admin/moderationService";
import { toast } from "react-toastify";

const STATUS_LABELS = {
  flagged: "Flagged",
  pending_review: "Pending Review",
  escalated: "Escalated",
  blocked: "Blocked",
  dismissed: "Dismissed",
  resolved: "Resolved",
};

const SEVERITY_BADGE = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-gray-900",
  low: "bg-blue-500 text-white",
};

const ACTIONS = [
  { label: "Approve", status: "resolved", tone: "text-green-600" },
  { label: "Dismiss", status: "dismissed", tone: "text-gray-600" },
  { label: "Block", status: "blocked", tone: "text-red-600" },
];

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch (err) {
    return value;
  }
};

const deriveMatches = (matchedWords) => {
  if (!Array.isArray(matchedWords)) return [];
  return matchedWords.map((entry) => {
    if (typeof entry === "string") return entry;
    if (entry && typeof entry === "object") {
      return entry.term || entry.label || entry.ruleId || "match";
    }
    return "match";
  });
};

export default function MessageFlagLog() {
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchFlaggedMessages({ contextType: "video_call" });
        setFlaggedMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load flagged messages", err);
        toast.error("Unable to load flagged messages");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredMessages = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return flaggedMessages.filter((msg) => {
      const statusMatches =
        statusFilter === "all" ? true : msg.status === statusFilter;
      if (!statusMatches) return false;
      if (!needle) return true;
      return (
        msg.user?.toLowerCase().includes(needle) ||
        msg.message?.toLowerCase().includes(needle) ||
        msg.contextId?.toLowerCase?.().includes(needle)
      );
    });
  }, [flaggedMessages, search, statusFilter]);

  const handleStatusChange = async (id, targetStatus) => {
    setActiveAction(`${id}:${targetStatus}`);
    try {
      const result = await updateFlaggedMessageStatus(id, { status: targetStatus });
      if (!result?.flag) {
        throw new Error("Empty response");
      }
      setFlaggedMessages((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: result.flag.status ?? item.status,
                severity: result.flag.severity ?? item.severity,
                matchedWords: result.flag.matchedWords ?? item.matchedWords,
                metadata: result.flag.metadata ?? item.metadata,
                autoActionTaken: result.flag.autoActionTaken ?? item.autoActionTaken,
                notes: result.flag.notes ?? item.notes,
                updatedAt: result.flag.updatedAt ?? item.updatedAt,
                messageStatus:
                  result.message?.moderationStatus ?? item.messageStatus,
                messageMetadata:
                  result.message?.flagMetadata ?? item.messageMetadata,
              }
            : item
        )
      );
      toast.success(`Flag ${STATUS_LABELS[targetStatus] || targetStatus}`);
    } catch (err) {
      console.error("Failed to update moderation status", err);
      toast.error("Failed to update moderation status");
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold">🚨 Flagged Messages</h2>
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <input
            type="search"
            placeholder="Search by user, message, or session id..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <p className="text-sm text-gray-600">Loading flagged messages…</p>
        ) : filteredMessages.length === 0 ? (
          <p className="text-sm text-gray-600">No flagged messages.</p>
        ) : (
          <table className="min-w-full table-auto text-sm text-left">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Severity</th>
                <th className="px-4 py-2">Message</th>
                <th className="px-4 py-2">Matches</th>
                <th className="px-4 py-2">Context</th>
                <th className="px-4 py-2">Flagged</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((msg) => {
                const matches = deriveMatches(msg.matchedWords);
                return (
                  <tr key={msg.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">
                      {msg.user || "Unknown"}
                    </td>
                    <td className="px-4 py-2 capitalize">{msg.role || "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                          SEVERITY_BADGE[msg.severity] || "bg-gray-300 text-gray-800"
                        }`}
                      >
                        {msg.severity ? msg.severity.toUpperCase() : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-red-600 max-w-xs">
                      <p className="line-clamp-3">{msg.message}</p>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {matches.length === 0 ? (
                          <span className="text-xs text-gray-500">—</span>
                        ) : (
                          matches.map((item, index) => (
                            <span
                              key={`${msg.id}-${item}-${index}`}
                              className="px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-700"
                            >
                              {item}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      <div className="flex flex-col">
                        <span className="font-medium uppercase text-gray-700">
                          {msg.contextType || "video_call"}
                        </span>
                        <span className="text-gray-500">
                          {msg.contextId || msg.roomId || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatDateTime(msg.createdAt)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          msg.status === "blocked"
                            ? "bg-red-100 text-red-600"
                            : msg.status === "resolved"
                            ? "bg-green-100 text-green-600"
                            : "bg-yellow-100 text-yellow-600"
                        }`}
                      >
                        {STATUS_LABELS[msg.status] || msg.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                      {ACTIONS.map((action) => (
                        <button
                          key={action.status}
                          className={`${action.tone} hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                          disabled={
                            activeAction === `${msg.id}:${action.status}` ||
                            msg.status === action.status
                          }
                          onClick={() => handleStatusChange(msg.id, action.status)}
                        >
                          {activeAction === `${msg.id}:${action.status}`
                            ? "Saving..."
                            : action.label}
                        </button>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
