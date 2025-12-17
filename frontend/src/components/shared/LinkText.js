import React from 'react';
import styles from './LinkText.module.scss';

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
            className={styles.link}
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
