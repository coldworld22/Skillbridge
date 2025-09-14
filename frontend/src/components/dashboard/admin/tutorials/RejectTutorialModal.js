import RejectionReasonModal from "@/components/common/RejectionReasonModal";

export default function RejectTutorialModal({ isOpen, onClose, onConfirm, t }) {
  return (
    <RejectionReasonModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t("reject_title")}
    />
  );
}
