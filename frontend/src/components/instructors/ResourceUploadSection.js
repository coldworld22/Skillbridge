// components/instructor/ResourceUploadSection.js
import { useState } from "react";

export default function ResourceUploadSection({ classId, isLive = false }) {
  const [resources, setResources] = useState([]);
  const [linkInput, setLinkInput] = useState("");
  const [fileName, setFileName] = useState("");

  const addLink = () => {
    if (!isLive || !linkInput || !fileName) return;
    setResources([...resources, { name: fileName, type: "link", value: linkInput }]);
    setLinkInput("");
    setFileName("");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!isLive || !file) return;
    if (
      file.type === "application/pdf" ||
      file.type.startsWith("image/")
    ) {
      setResources([...resources, { name: file.name, type: "file", value: file }]);
    } else {
      alert("Only PDF or image files are allowed");
    }
  };

  return (
    <div className="text-sm text-white space-y-4">

      {!isLive ? (
        <p className="text-yellow-300">
          Resource uploading is only available during live sessions.
        </p>
      ) : (
        <p className="text-green-400">Live session active. Upload resources below.</p>

      )}

      {isLive && (
        <>
          {/* Add External Link */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="File name (e.g., React Guide)"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-white"
            />
            <input
              type="text"
              placeholder="Paste external link (https://...)"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-white"
            />
            <button
              onClick={addLink}
              className="w-full bg-yellow-500 text-black py-2 rounded hover:bg-yellow-600 font-semibold"
            >
              Add Link
            </button>
          </div>

          {/* Upload File */}
          <div>
            <label className="block mb-1 text-yellow-300">Upload File</label>
            <input
              type="file"
              onChange={handleFileUpload}
              accept="application/pdf,image/*"
              className="block w-full text-sm text-white bg-gray-800 border border-gray-600 rounded file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600"
            />
          </div>
        </>
      )}

      {/* Resource List */}
      <div className="mt-4 space-y-2">
        <h3 className="font-semibold text-yellow-400">📚 Resources</h3>
        <ul className="space-y-1">
          {resources.map((res, i) => (
            <li key={i} className="bg-gray-700 px-4 py-2 rounded flex justify-between">
              <span>{res.name}</span>
              {res.type === "link" ? (
                <a href={res.value} target="_blank" className="text-yellow-300 hover:underline">View</a>
              ) : (
                <span className="text-gray-400">Uploaded</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
