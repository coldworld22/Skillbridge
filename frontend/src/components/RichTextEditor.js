import React, { useState, useEffect } from "react";
import { Editor, EditorState, RichUtils, convertToRaw, ContentState } from "draft-js";
import "draft-js/dist/Draft.css"; // Import Draft.js styles
import styles from "./RichTextEditor.module.scss";

const RichTextEditor = ({ onChange, value }) => {
  const [editorState, setEditorState] = useState(() =>
    value ? EditorState.createWithContent(ContentState.createFromText(value)) : EditorState.createEmpty()
  );

  useEffect(() => {
    if (value === undefined) return;
    const currentText = editorState.getCurrentContent().getPlainText();
    if (value === "" && currentText !== "") {
      setEditorState(EditorState.createEmpty());
    } else if (value !== "" && value !== currentText) {
      setEditorState(EditorState.createWithContent(ContentState.createFromText(value)));
    }
  }, [value]);

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
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <button className={styles.button} onClick={() => handleStyleToggle("BOLD")}>Bold</button>
        <button className={styles.button} onClick={() => handleStyleToggle("ITALIC")}>Italic</button>
        <button className={styles.button} onClick={() => handleStyleToggle("UNDERLINE")}>Underline</button>
      </div>

      <div className={styles.editor}>
        <Editor editorState={editorState} onChange={handleEditorChange} placeholder="Write your question here..." />
      </div>
    </div>
  );
};

export default RichTextEditor;
