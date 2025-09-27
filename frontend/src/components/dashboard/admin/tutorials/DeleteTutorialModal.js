import ConfirmModal from "@/components/common/ConfirmModal";

export default function DeleteTutorialModal({ isOpen, onClose, onConfirm, t }) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t("delete_confirm_title")}
      message={t("delete_confirm_message")}
    />
  );
}
