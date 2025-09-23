import React from 'react';

const urlRegex = /(https?:\/\/[^\s]+)/;
export const DEFAULT_LINK_TEXT = 'New notification';
export default function LinkText({ text }) {
  const safeText =
    typeof text === 'string'
      ? text
      : text == null
        ? ''
        : String(text);

  const parts = safeText ? safeText.split(urlRegex) : [''];
  return (
    <>
      {parts.map((part, index) => {
        const isUrl = urlRegex.test(part);
        return isUrl ? (
          <a
            key={`link-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {part}
          </a>
        ) : (
          <React.Fragment key={`text-${index}`}>{part}</React.Fragment>
        );
      })}
    </>
  );
}
