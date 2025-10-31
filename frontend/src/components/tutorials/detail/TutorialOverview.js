import { useMemo, useState } from "react";
import { normalizeText } from "@/utils/text";

const MAX_PREVIEW_LENGTH = 300;

const TutorialOverview = ({ description }) => {
  const [expanded, setExpanded] = useState(false);
  const safeDescription = useMemo(
    () => normalizeText(description).trim(),
    [description],
  );
  const isLong = safeDescription.length > MAX_PREVIEW_LENGTH;
  const preview = isLong
    ? `${safeDescription.slice(0, MAX_PREVIEW_LENGTH)}...`
    : safeDescription;

  return (
    <div className="mb-12 bg-gray-800 rounded-lg p-6 shadow-md border border-gray-700">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4 border-b border-yellow-500 pb-2">
        📘 Tutorial Overview
      </h2>
      <p className="text-gray-300 leading-relaxed text-sm md:text-base transition-all duration-300">
        {expanded || !isLong ? safeDescription : preview}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-yellow-400 hover:underline text-sm font-medium"
        >
          {expanded ? "Show Less ▲" : "Read More ▼"}
        </button>
      )}
    </div>
  );
};

export default TutorialOverview;
