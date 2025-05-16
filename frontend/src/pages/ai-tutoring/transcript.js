import { useState, useEffect } from "react";
import { FaDownload, FaHistory } from "react-icons/fa";

const mockTranscript = {
  model: "ChatGPT 4",
  field: "Medicine",
  goals: "Prepare for board exams, review clinical cases, and improve academic writing.",
  history: [
    { type: "Quiz", date: "2025-05-01", detail: "Scored 4/5 in Anatomy basics" },
    { type: "Feedback", date: "2025-05-03", detail: "Essay on cardiovascular system reviewed" },
    { type: "Research", date: "2025-05-04", detail: "Summarized paper on medical ethics" },
    { type: "Chat", date: "2025-05-06", detail: "Asked about drug interactions" }
  ]
};

export default function AITranscriptPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Simulate fetching user transcript
    setTimeout(() => setData(mockTranscript), 800);
  }, []);

  const downloadTranscript = () => {
    const content = `AI Transcript\n\nModel: ${data.model}\nField: ${data.field}\nGoals: ${data.goals}\n\nActivity Log:\n` +
      data.history.map(item => `- [${item.date}] ${item.type}: ${item.detail}`).join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "AI_Transcript.txt";
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-4">📘 AI Learning Transcript</h1>
        <p className="text-gray-300 mb-6">A personal log of your AI-assisted educational journey—tailored to your goals and interactions.</p>

        {!data ? (
          <p className="text-gray-400">Loading transcript...</p>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 shadow">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-yellow-300 mb-2">🎯 Your Setup</h2>
              <p><strong>Model:</strong> {data.model}</p>
              <p><strong>Field:</strong> {data.field}</p>
              <p><strong>Goals:</strong> {data.goals}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-yellow-300 mb-4">📑 Activity Log</h2>
              <ul className="space-y-3">
                {data.history.map((entry, i) => (
                  <li key={i} className="bg-gray-700 p-3 rounded flex gap-4 items-start">
                    <FaHistory className="mt-1 text-yellow-400" />
                    <div>
                      <p className="text-sm text-gray-200">[{entry.date}] <strong>{entry.type}</strong>: {entry.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={downloadTranscript}
              className="mt-8 bg-yellow-500 text-gray-900 px-6 py-2 rounded hover:bg-yellow-600 flex items-center gap-2"
            >
              <FaDownload /> Download Transcript
            </button>
          </div>
        )}
      </div>
    </div>
  );
}