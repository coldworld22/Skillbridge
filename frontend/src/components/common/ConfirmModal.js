// src/components/common/ConfirmModal.js

import React from "react";
import { useTranslation } from "next-i18next";
import { Button } from "@/components/ui/button";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmText,
  cancelText,
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {t(title || "Confirm Deletion")}
        </h2>
        {message && (
          <p className="text-gray-600 mb-6">{t(message)}</p>
        )}
        <div className="flex justify-end gap-4">
          <Button
            onClick={onClose}
            className="bg-gray-300 text-black hover:bg-gray-400"
          >
            {t(cancelText || "Cancel")}
          </Button>
          <Button
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {t(confirmText || "Confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}

