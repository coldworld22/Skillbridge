// src/components/common/RejectionReasonModal.js

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import styles from "./Modal.module.scss";

export default function RejectionReasonModal({ isOpen, onClose, onConfirm }) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className={styles.simpleOverlay}>
      <div className={styles.panel}>
        <h2 className={`${styles.title} ${styles.dangerTitle}`}>Reject Tutorial</h2>
        <textarea
          className={styles.textarea}
          placeholder="Enter rejection reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className={styles.actions}>
          <Button variant="neutral" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm(reason);
              setReason(""); // Clear after submit
            }}
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
