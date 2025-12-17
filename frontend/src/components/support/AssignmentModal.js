import { PromptModal } from "@/components/common/Modal";

export default function AssignmentModal({ open, onAssign, onClose }) {
  return (
    <PromptModal
      isOpen={open}
      title="sidebar.assign_ticket"
      message="sidebar.admin_id"
      placeholder="sidebar.admin_id"
      confirmText="sidebar.assign"
      cancelText="cancel"
      onClose={onClose}
      onConfirm={(val) => {
        if (val) onAssign(Number(val));
      }}
      ns="dashboard"
    />
  );
}
