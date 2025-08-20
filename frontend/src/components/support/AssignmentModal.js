import { PromptModal } from "@/components/common/Modal";

export default function AssignmentModal({ open, onAssign, onClose }) {
  return (
    <PromptModal
      isOpen={open}
      title="assign_ticket"
      message="admin_id"
      placeholder="admin_id"
      confirmText="assign"
      cancelText="cancel"
      onClose={onClose}
      onConfirm={(val) => {
        if (val) onAssign(Number(val));
      }}
      ns="dashboard"
    />
  );
}
