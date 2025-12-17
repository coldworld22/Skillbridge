import PreviewModalBase from './PreviewModalBase';

const PreviewModal = ({ ad, onClose }) => {
  const analyticsUrl = ad?.id ? `/dashboard/admin/ads/analytics/${ad.id}` : undefined;
  return <PreviewModalBase ad={ad} onClose={onClose} analyticsUrl={analyticsUrl} />;
};

export default PreviewModal;
