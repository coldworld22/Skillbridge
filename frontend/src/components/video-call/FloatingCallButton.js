import React from "react";
import { FaPhone } from "react-icons/fa";
import styles from "./FloatingCallButton.module.scss";

const FloatingCallButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className={styles.button}
      type="button"
    >
      <FaPhone className={styles.icon} />
    </button>
  );
};

export default FloatingCallButton;
