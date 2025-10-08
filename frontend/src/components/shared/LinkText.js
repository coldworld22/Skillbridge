import React from 'react';

const urlRegex = /(https?:\/\/[^\s]+)/;

export default function LinkText({ text }) {
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part, index) =>
        new RegExp(urlRegex).test(part) ? (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {part}
          </a>
        ) : (
          part
        )
      )}
    </>
  );
}
