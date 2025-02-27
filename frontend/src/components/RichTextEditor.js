import React, { useState } from "react";
import { Editor, EditorState, RichUtils, convertToRaw } from "draft-js";
import "draft-js/dist/Draft.css"; // Import Draft.js styles

const RichTextEditor = ({ onChange }) => {
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());

  // Handle changes in the editor
  const handleEditorChange = (newState) => {
    setEditorState(newState);

    if (onChange) {
      try {
        const rawContent = convertToRaw(newState.getCurrentContent());
        const plainText = rawContent.blocks.map(block => block.text).join(" "); // Extract text content
        onChange(plainText);
      } catch (error) {
        console.error("Error extracting text:", error);
      }
    }
  };

  // Handle formatting (Bold, Italic, Underline)
  const handleStyleToggle = (style) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-md">
      {/* Formatting Buttons */}
      <div className="flex space-x-2 mb-3">
        <button className="px-3 py-1 bg-yellow-500 text-gray-900 rounded-md" onClick={() => handleStyleToggle("BOLD")}>Bold</button>
        <button className="px-3 py-1 bg-yellow-500 text-gray-900 rounded-md" onClick={() => handleStyleToggle("ITALIC")}>Italic</button>
        <button className="px-3 py-1 bg-yellow-500 text-gray-900 rounded-md" onClick={() => handleStyleToggle("UNDERLINE")}>Underline</button>
      </div>

      {/* Draft.js Editor */}
      <div className="border border-gray-700 p-3 rounded-md bg-gray-900 min-h-[150px]">
        <Editor editorState={editorState} onChange={handleEditorChange} placeholder="Write your question here..." />
      </div>
    </div>
  );
};

export default RichTextEditor;
