import { useState } from "react";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import {
  createClassResource,
  deleteClassResource,
} from "@/services/classResourceService";

export default function ResourceUploadSection({
  classId,
  resources = [],
  isLive = false,
  onResourceCreated,
  onResourceDeleted,
}) {
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState(null);
  const [fileTitle, setFileTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const warnIfNotLive = () => {
    if (!isLive) {
      toast.info("Go live to share materials with your class in real time.");
      return true;
    }
    return false;
  };

  const handleLinkSubmit = async () => {
    if (warnIfNotLive()) return;
    if (!linkTitle.trim() || !linkUrl.trim()) {
      toast.error("Provide both a title and a valid URL.");
      return;
    }
    setSubmitting(true);
    try {
      const resource = await createClassResource(classId, {
        title: linkTitle.trim(),
        resource_type: "link",
        link_url: linkUrl.trim(),
      });
      onResourceCreated?.(resource);
      toast.success("Link shared with your class.");
      setLinkTitle("");
      setLinkUrl("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to share link. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    setFile(selected || null);
    if (selected && !fileTitle) {
      setFileTitle(selected.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleFileUpload = async () => {
    if (warnIfNotLive()) return;
    if (!file || !fileTitle.trim()) {
      toast.error("Select a file and provide a title.");
      return;
    }
    setSubmitting(true);
    try {
      const resource = await createClassResource(classId, {
        title: fileTitle.trim(),
        resource_type: "file",
        file,
      });
      onResourceCreated?.(resource);
      toast.success("File uploaded successfully.");
      setFile(null);
      setFileTitle("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this resource for everyone in the class?")) {
      return;
    }
    try {
      await deleteClassResource(id);
      onResourceDeleted?.(id);
      toast.success("Resource removed.");
    } catch (err) {
      console.error(err);
      toast.error("Unable to remove resource right now.");
    }
  };

  return (
    <div className="text-sm text-white space-y-6">
      <div
        className={`rounded-lg border ${
          isLive
            ? "border-green-500 bg-green-500/10"
            : "border-yellow-500 bg-yellow-500/5"
        } p-4`}
      >
        <p className="font-medium">
          {isLive
            ? "You're live — anything you share will reach students instantly."
            : "Materials can be shared while the class is live so students see them right away."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-gray-800 rounded-lg p-4 space-y-3 border border-gray-700">
          <h3 className="text-yellow-300 font-semibold">Share a Link</h3>
          <input
            type="text"
            placeholder="Title (e.g., React Cheatsheet)"
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-yellow-500"
          />
          <input
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-yellow-500"
          />
          <button
            onClick={handleLinkSubmit}
            disabled={submitting}
            className="w-full bg-yellow-500 text-black py-2 rounded hover:bg-yellow-600 font-semibold disabled:opacity-60"
          >
            Share Link
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 space-y-3 border border-gray-700">
          <h3 className="text-yellow-300 font-semibold">Upload a File</h3>
          <input
            type="text"
            placeholder="Display name"
            value={fileTitle}
            onChange={(e) => setFileTitle(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-yellow-500"
          />
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-white bg-gray-800 border border-gray-600 rounded file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600"
          />
          <button
            onClick={handleFileUpload}
            disabled={submitting || !file}
            className="w-full bg-yellow-500 text-black py-2 rounded hover:bg-yellow-600 font-semibold disabled:opacity-60"
          >
            Upload File
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-yellow-400">Shared Resources</h3>
          <span className="text-xs text-gray-400">
            {resources.length === 0
              ? "Nothing shared yet"
              : `${resources.length} item${resources.length > 1 ? "s" : ""}`}
          </span>
        </div>
        <ul className="space-y-2">
          {resources.map((resource) => (
            <li
              key={resource.id}
              className="bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <p className="font-medium text-white flex items-center gap-2">
                  {resource.title}
                  <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                    {resource.resource_type === "file" ? "File" : "Link"}
                  </span>
                </p>
                {resource.created_at && (
                  <p className="text-xs text-gray-400">
                    Shared {formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                {resource.resource_type === "file" ? (
                  <a
                    href={resource.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-300 hover:underline"
                  >
                    Download
                  </a>
                ) : (
                  <a
                    href={resource.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-300 hover:underline"
                  >
                    Open Link
                  </a>
                )}
                <button
                  onClick={() => handleDelete(resource.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
