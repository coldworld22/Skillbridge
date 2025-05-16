// src/components/common/RejectionReasonModal.js

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export default function RejectionReasonModal({ isOpen, onClose, onConfirm }) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Reject Tutorial</h2>
        <textarea
          className="w-full p-2 border rounded mb-4"
          rows="4"
          placeholder="Enter rejection reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button
            className="bg-gray-300 text-gray-800 hover:bg-gray-400"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-500 text-white hover:bg-red-600"
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
