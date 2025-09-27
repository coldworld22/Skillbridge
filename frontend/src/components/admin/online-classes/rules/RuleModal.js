import { useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import { Button } from "@/components/ui/button";

export default function RuleModal({ isOpen, onClose, initialData, onSave }) {
  const [text, setText] = useState(initialData?.text || "");

  useEffect(() => {
    if (initialData) {
      const legacyText = [initialData.title, initialData.description]
        .filter(Boolean)
        .join("\n")
        .trim();
      setText(initialData.text || legacyText || "");
    } else {
      setText("");
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.({ text });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Rule" : "Add Rule"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Rule</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            rows={4}
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            onClick={onClose}
            className="bg-gray-300 text-black hover:bg-gray-400"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {initialData ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

